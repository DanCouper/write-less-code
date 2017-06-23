'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function noop() {
  return void 0;
}
/**
 * Creates and initialises a slider. If the slider is not
 * fully initialised, the page shouold just render a single slide,
 * with no controls.
 *
 * REVIEW all slide-to code should be in one handler, call that with params
 * REVIEW too much state, reduce if poss
 */

var Slider = function () {
  function Slider(element) {
    _classCallCheck(this, Slider);

    // DOM selection:
    this.slider = document.querySelector(element);
    this.slidesContainer = this.slider.querySelector('.js-slides');
    this.slides = this.slider.querySelectorAll('.js-slide');

    // Overwrite the slider defaults with anything passed in as data attributes:
    this.opts = Object.assign({
      autoplay: 'true',
      intervalTime: 4000,
      transitionDelay: '0s',
      transitionDuration: '.75s',
      transitionTimingFunction: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)'
    }, this.slider.dataset);

    // Set up remaining necessary state:
    this.currentSlide = 1; // The slides are 1-indexed, and current slide always starts at 1
    this.numSlides = this.slides.length;
    this.isPlaying = false; // use to check if autoplay timer should be reset when next/prev slide is clicked
    this.interval; // initially undefined reference used for the interval used playing the slideshow

    // Initialise:
    this.setupControls();
    this.setupTransitions();
    this.bindEvents();
  }

  _createClass(Slider, [{
    key: 'setupControls',
    value: function setupControls() {
      // DOM controls (these may not exist):

      // NOTE previous/next/play/pause controls are all defined seperately
      // to allow them to be placed anywhere within the slider markup
      // and styled individually
      this.sliderControlPrev = this.slider.querySelector('.js-slider-control-prev');
      this.sliderControlNext = this.slider.querySelector('.js-slider-control-next');
      // For the controls to work, both prev and next *must* be present.
      this.hasControls = !!this.sliderControlPrev && !!this.sliderControlNext;

      this.sliderControlPlay = this.slider.querySelector('.js-slider-control-play');
      this.sliderControlPause = this.slider.querySelector('.js-slider-control-pause');
      // for the autoplay to work, pause and play *must* be present.
      this.canPlay = !!this.sliderControlPlay && !!this.sliderControlPause;

      // NOTE the slider indicators should be defined as a contained set of
      // elements (eg `<button>`s in a `<fieldset>`)
      this.sliderIndicators = this.slider.querySelectorAll('.js-slider-indicator');
      this.sliderIndicatorsContainer = this.sliderIndicators[0].parentNode;
      this.hasIndicators = this.sliderIndicators.length > 0;

      // SLideshow should immediately blow up if there are no controls located:
      if (!this.hasControls && !this.canPlay && !this.hasIndicators) throw new Error('Slider controls cannot be located in the DOM');

      // If there is only one slide (or none), no controls should be rendered
      // even if they are present in the DOM:
      if (this.numSlides < 2) {
        if (this.hasControls) {
          [this.sliderControlPrev, this.sliderControlNext].forEach(function (ctrl) {
            return ctrl.setAttribute('aria-hidden', 'true');
          });
        }
        if (this.canPlay) {
          [this.sliderControlPlay, this.sliderControlPause].forEach(function (ctrl) {
            return ctrl.setAttribute('aria-hidden', 'true');
          });
        }
        if (this.hasIndicators) {
          this.sliderIndicatorsContainer.setAttribute('aria-hidden', 'true');
        }
      }
    }
  }, {
    key: 'loadRemainingSlides',
    value: function loadRemainingSlides() {
      [].concat(_toConsumableArray(this.slidesContainer.querySelectorAll('img[data-src]'))).forEach(function (img) {
        img.setAttribute('src', img.dataset.src);
        img.onload = function () {
          return img.removeAttribute('data-src');
        };
      });
    }
  }, {
    key: 'setupTransitions',
    value: function setupTransitions() {
      // The sliding transition is inherently tied to the slider UI,
      // ∵ it depends upon knowing number of slides; ∴ rendered inline
      Object.assign(this.slidesContainer.style, {
        width: this.numSlides * 100 + '%',
        transitionDelay: this.opts.transitionDelay,
        transitionDuration: this.opts.transitionDuration,
        transitionProperty: 'transform',
        transitionTimingFunction: this.opts.transitionTimingFunction
      });

      this.applyTranslation();
    }
  }, {
    key: 'applyTranslation',
    value: function applyTranslation() {
      var translation = 'translateX(-' + (this.currentSlide - 1) * (100 / this.numSlides) + '%)';
      this.slidesContainer.style.transform = translation;
    }
  }, {
    key: 'setIndicator',
    value: function setIndicator() {
      var _this = this;

      [].concat(_toConsumableArray(this.sliderIndicators)).forEach(function (indicator, i) {
        indicator.setAttribute('aria-selected', i + 1 === _this.currentSlide ? 'true' : 'false');
      });
    }
  }, {
    key: 'showCurrent',
    value: function showCurrent() {
      var _this2 = this;

      // Switch aria-hidden on and off for accessibility reasons - the
      // non-visible slides should be hidden from accessibility tools.
      [].concat(_toConsumableArray(this.slides)).forEach(function (slide, i) {
        // NOTE Slides are 1-indexed, so when looping through the
        // slides, need to compare against i + 1.
        slide.setAttribute('aria-hidden', i + 1 === _this2.currentSlide ? 'false' : 'true');
      });
      this.setIndicator();
      this.applyTranslation();
    }
  }, {
    key: 'handleSlideTo',
    value: function handleSlideTo(n) {
      window.clearInterval(this.interval);
      this.currentSlide = n;
      this.showCurrent();
      if (this.canPlay && this.isPlaying) this.handlePlaySlides();
    }
  }, {
    key: 'handleIndicatorSelect',
    value: function handleIndicatorSelect(e) {
      var selectedSlideIndex = [].concat(_toConsumableArray(this.sliderIndicatorsContainer.children)).indexOf(e.target);
      this.handleSlideTo(selectedSlideIndex + 1);
    }
  }, {
    key: 'handleNextSlide',
    value: function handleNextSlide(e) {
      this.handleSlideTo(this.currentSlide + 1 > this.numSlides ? 1 : this.currentSlide + 1);
    }
  }, {
    key: 'handlePrevSlide',
    value: function handlePrevSlide(e) {
      this.handleSlideTo(this.currentSlide - 1 === 0 ? this.numSlides : this.currentSlide - 1);
    }
  }, {
    key: 'handlePlaySlides',
    value: function handlePlaySlides(e) {
      var _this3 = this;

      this.sliderControlPlay.disabled = true;
      this.isPlaying = true;
      this.interval = setInterval(function () {
        return _this3.handleNextSlide();
      }, this.opts.intervalTime);
      this.sliderControlPause.disabled = false;
    }
  }, {
    key: 'handlePauseSlides',
    value: function handlePauseSlides(e) {
      this.sliderControlPause.disabled = true;
      this.isPlaying = false;
      this.interval = window.clearInterval(this.interval);
      this.sliderControlPlay.disabled = false;
    }
  }, {
    key: 'bindEvents',
    value: function bindEvents() {
      var _this4 = this;

      this.slider.addEventListener('click', function (e) {
        switch (true) {
          case e.target == _this4.sliderControlPrev:
            _this4.handlePrevSlide(e);break;
          case e.target == _this4.sliderControlNext:
            _this4.handleNextSlide(e);break;
          case e.target == _this4.sliderControlPlay:
            _this4.handlePlaySlides(e);break;
          case e.target == _this4.sliderControlPause:
            _this4.handlePauseSlides(e);break;
          case _this4.sliderIndicatorsContainer.contains(e.target):
            _this4.handleIndicatorSelect(e);break;
        }
      });

      // Once everything on the page, including images, has loaded, load the
      // remaining slide images and start playing slides if autoplay option is true:
      window.addEventListener('load', function () {
        _this4.loadRemainingSlides();
        switch (_this4.opts.autoplay) {
          case 'true':
            _this4.handlePlaySlides();break;
          case 'false':
            _this4.handlePauseSlides();break;
        }
      });
    }
  }]);

  return Slider;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qcy1jYXJvdXNlbC9zbGlkZXIuanMiXSwibmFtZXMiOlsibm9vcCIsIlNsaWRlciIsImVsZW1lbnQiLCJzbGlkZXIiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJzbGlkZXNDb250YWluZXIiLCJzbGlkZXMiLCJxdWVyeVNlbGVjdG9yQWxsIiwib3B0cyIsIk9iamVjdCIsImFzc2lnbiIsImF1dG9wbGF5IiwiaW50ZXJ2YWxUaW1lIiwidHJhbnNpdGlvbkRlbGF5IiwidHJhbnNpdGlvbkR1cmF0aW9uIiwidHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uIiwiZGF0YXNldCIsImN1cnJlbnRTbGlkZSIsIm51bVNsaWRlcyIsImxlbmd0aCIsImlzUGxheWluZyIsImludGVydmFsIiwic2V0dXBDb250cm9scyIsInNldHVwVHJhbnNpdGlvbnMiLCJiaW5kRXZlbnRzIiwic2xpZGVyQ29udHJvbFByZXYiLCJzbGlkZXJDb250cm9sTmV4dCIsImhhc0NvbnRyb2xzIiwic2xpZGVyQ29udHJvbFBsYXkiLCJzbGlkZXJDb250cm9sUGF1c2UiLCJjYW5QbGF5Iiwic2xpZGVySW5kaWNhdG9ycyIsInNsaWRlckluZGljYXRvcnNDb250YWluZXIiLCJwYXJlbnROb2RlIiwiaGFzSW5kaWNhdG9ycyIsIkVycm9yIiwiZm9yRWFjaCIsImN0cmwiLCJzZXRBdHRyaWJ1dGUiLCJpbWciLCJzcmMiLCJvbmxvYWQiLCJyZW1vdmVBdHRyaWJ1dGUiLCJzdHlsZSIsIndpZHRoIiwidHJhbnNpdGlvblByb3BlcnR5IiwiYXBwbHlUcmFuc2xhdGlvbiIsInRyYW5zbGF0aW9uIiwidHJhbnNmb3JtIiwiaW5kaWNhdG9yIiwiaSIsInNsaWRlIiwic2V0SW5kaWNhdG9yIiwibiIsIndpbmRvdyIsImNsZWFySW50ZXJ2YWwiLCJzaG93Q3VycmVudCIsImhhbmRsZVBsYXlTbGlkZXMiLCJlIiwic2VsZWN0ZWRTbGlkZUluZGV4IiwiY2hpbGRyZW4iLCJpbmRleE9mIiwidGFyZ2V0IiwiaGFuZGxlU2xpZGVUbyIsImRpc2FibGVkIiwic2V0SW50ZXJ2YWwiLCJoYW5kbGVOZXh0U2xpZGUiLCJhZGRFdmVudExpc3RlbmVyIiwiaGFuZGxlUHJldlNsaWRlIiwiaGFuZGxlUGF1c2VTbGlkZXMiLCJjb250YWlucyIsImhhbmRsZUluZGljYXRvclNlbGVjdCIsImxvYWRSZW1haW5pbmdTbGlkZXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsU0FBU0EsSUFBVCxHQUFnQjtBQUFFLFNBQU8sS0FBSyxDQUFaO0FBQWdCO0FBQ2xDOzs7Ozs7Ozs7SUFTTUMsTTtBQUNKLGtCQUFZQyxPQUFaLEVBQXFCO0FBQUE7O0FBRW5CO0FBQ0EsU0FBS0MsTUFBTCxHQUFjQyxTQUFTQyxhQUFULENBQXVCSCxPQUF2QixDQUFkO0FBQ0EsU0FBS0ksZUFBTCxHQUF1QixLQUFLSCxNQUFMLENBQVlFLGFBQVosQ0FBMEIsWUFBMUIsQ0FBdkI7QUFDQSxTQUFLRSxNQUFMLEdBQWMsS0FBS0osTUFBTCxDQUFZSyxnQkFBWixDQUE2QixXQUE3QixDQUFkOztBQUVBO0FBQ0EsU0FBS0MsSUFBTCxHQUFZQyxPQUFPQyxNQUFQLENBQWM7QUFDeEJDLGdCQUFVLE1BRGM7QUFFeEJDLG9CQUFjLElBRlU7QUFHeEJDLHVCQUFpQixJQUhPO0FBSXhCQywwQkFBb0IsTUFKSTtBQUt4QkMsZ0NBQTBCO0FBTEYsS0FBZCxFQU1ULEtBQUtiLE1BQUwsQ0FBWWMsT0FOSCxDQUFaOztBQVFBO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQixDQUFwQixDQWpCbUIsQ0FpQkk7QUFDdkIsU0FBS0MsU0FBTCxHQUFpQixLQUFLWixNQUFMLENBQVlhLE1BQTdCO0FBQ0EsU0FBS0MsU0FBTCxHQUFpQixLQUFqQixDQW5CbUIsQ0FtQks7QUFDeEIsU0FBS0MsUUFBTCxDQXBCbUIsQ0FvQko7O0FBRWY7QUFDQSxTQUFLQyxhQUFMO0FBQ0EsU0FBS0MsZ0JBQUw7QUFDQSxTQUFLQyxVQUFMO0FBQ0Q7Ozs7b0NBRWU7QUFDZDs7QUFFQTtB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QUFBeUMsbUJBQUs2QixnQkFBTCxDQUFzQkMsQ0FBdEIsRUFBMEI7QUFDbkUsZUFBS0EsRUFBRUksTUFBRixJQUFZLE9BQUtqQyxrQkFBdEI7QUFBMEMsbUJBQUt3QyxpQkFBTCxDQUF1QlgsQ0FBdkIsRUFBMkI7QUFDckUsZUFBSyxPQUFLMUIseUJBQUwsQ0FBK0JzQyxRQUEvQixDQUF3Q1osRUFBRUksTUFBMUMsQ0FBTDtBQUF3RCxtQkFBS1MscUJBQUwsQ0FBMkJiLENBQTNCLEVBQStCO0FBTHpGO0FBT0QsT0FSRDs7QUFVQTtBQUNBO0FBQ0FKLGFBQU9hLGdCQUFQLENBQXdCLE1BQXhCLEVBQWdDLFlBQU07QUFDcEMsZUFBS0ssbUJBQUw7QUFDQSxnQkFBUSxPQUFLaEUsSUFBTCxDQUFVRyxRQUFsQjtBQUNFLGVBQUssTUFBTDtBQUFhLG1CQUFLOEMsZ0JBQUwsR0FBeUI7QUFDdEMsZUFBSyxPQUFMO0FBQWMsbUJBQUtZLGlCQUFMLEdBQTBCO0FBRjFDO0FBSUQsT0FORDtBQU9EIiwiZmlsZSI6InNsaWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIG5vb3AoKSB7IHJldHVybiB2b2lkIDA7IH1cbi8qKlxuICogQ3JlYXRlcyBhbmQgaW5pdGlhbGlzZXMgYSBzbGlkZXIuIElmIHRoZSBzbGlkZXIgaXMgbm90XG4gKiBmdWxseSBpbml0aWFsaXNlZCwgdGhlIHBhZ2Ugc2hvdW9sZCBqdXN0IHJlbmRlciBhIHNpbmdsZSBzbGlkZSxcbiAqIHdpdGggbm8gY29udHJvbHMuXG4gKlxuICogUkVWSUVXIGFsbCBzbGlkZS10byBjb2RlIHNob3VsZCBiZSBpbiBvbmUgaGFuZGxlciwgY2FsbCB0aGF0IHdpdGggcGFyYW1zXG4gKiBSRVZJRVcgdG9vIG11Y2ggc3RhdGUsIHJlZHVjZSBpZiBwb3NzXG4gKi9cblxuY2xhc3MgU2xpZGVyIHtcbiAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuXG4gICAgLy8gRE9NIHNlbGVjdGlvbjpcbiAgICB0aGlzLnNsaWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudCk7XG4gICAgdGhpcy5zbGlkZXNDb250YWluZXIgPSB0aGlzLnNsaWRlci5xdWVyeVNlbGVjdG9yKCcuanMtc2xpZGVzJyk7XG4gICAgdGhpcy5zbGlkZXMgPSB0aGlzLnNsaWRlci5xdWVyeVNlbGVjdG9yQWxsKCcuanMtc2xpZGUnKTtcblxuICAgIC8vIE92ZXJ3cml0ZSB0aGUgc2xpZGVyIGRlZmF1bHRzIHdpdGggYW55dGhpbmcgcGFzc2VkIGluIGFzIGRhdGEgYXR0cmlidXRlczpcbiAgICB0aGlzLm9wdHMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGF1dG9wbGF5OiAndHJ1ZScsXG4gICAgICBpbnRlcnZhbFRpbWU6IDQwMDAsXG4gICAgICB0cmFuc2l0aW9uRGVsYXk6ICcwcycsXG4gICAgICB0cmFuc2l0aW9uRHVyYXRpb246ICcuNzVzJyxcbiAgICAgIHRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbjogJ2N1YmljLWJlemllcigwLjU1MCwgMC4wNTUsIDAuNjc1LCAwLjE5MCknXG4gICAgfSwgdGhpcy5zbGlkZXIuZGF0YXNldCk7XG5cbiAgICAvLyBTZXQgdXAgcmVtYWluaW5nIG5lY2Vzc2FyeSBzdGF0ZTpcbiAgICB0aGlzLmN1cnJlbnRTbGlkZSA9IDE7IC8vIFRoZSBzbGlkZXMgYXJlIDEtaW5kZXhlZCwgYW5kIGN1cnJlbnQgc2xpZGUgYWx3YXlzIHN0YXJ0cyBhdCAxXG4gICAgdGhpcy5udW1TbGlkZXMgPSB0aGlzLnNsaWRlcy5sZW5ndGg7XG4gICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTsgLy8gdXNlIHRvIGNoZWNrIGlmIGF1dG9wbGF5IHRpbWVyIHNob3VsZCBiZSByZXNldCB3aGVuIG5leHQvcHJldiBzbGlkZSBpcyBjbGlja2VkXG4gICAgdGhpcy5pbnRlcnZhbDsgLy8gaW5pdGlhbGx5IHVuZGVmaW5lZCByZWZlcmVuY2UgdXNlZCBmb3IgdGhlIGludGVydmFsIHVzZWQgcGxheWluZyB0aGUgc2xpZGVzaG93XG5cbiAgICAvLyBJbml0aWFsaXNlOlxuICAgIHRoaXMuc2V0dXBDb250cm9scygpO1xuICAgIHRoaXMuc2V0dXBUcmFuc2l0aW9ucygpO1xuICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICB9XG5cbiAgc2V0dXBDb250cm9scygpIHtcbiAgICAvLyBET00gY29udHJvbHMgKHRoZXNlIG1heSBub3QgZXhpc3QpOlxuXG4gICAgLy8gTk9URSBwcmV2aW91cy9uZXh0L3BsYXkvcGF1c2UgY29udHJvbHMgYXJlIGFsbCBkZWZpbmVkIHNlcGVyYXRlbHlcbiAgICAvLyB0byBhbGxvdyB0aGVtIHRvIGJlIHBsYWNlZCBhbnl3aGVyZSB3aXRoaW4gdGhlIHNsaWRlciBtYXJrdXBcbiAgICAvLyBhbmQgc3R5bGVkIGluZGl2aWR1YWxseVxuICAgIHRoaXMuc2xpZGVyQ29udHJvbFByZXYgPSB0aGlzLnNsaWRlci5xdWVyeVNlbGVjdG9yKCcuanMtc2xpZGVyLWNvbnRyb2wtcHJldicpO1xuICAgIHRoaXMuc2xpZGVyQ29udHJvbE5leHQgPSB0aGlzLnNsaWRlci5xdWVyeVNlbGVjdG9yKCcuanMtc2xpZGVyLWNvbnRyb2wtbmV4dCcpO1xuICAgIC8vIEZvciB0aGUgY29udHJvbHMgdG8gd29yaywgYm90aCBwcmV2IGFuZCBuZXh0ICptdXN0KiBiZSBwcmVzZW50LlxuICAgIHRoaXMuaGFzQ29udHJvbHMgPSAhIXRoaXMuc2xpZGVyQ29udHJvbFByZXYgJiYgISF0aGlzLnNsaWRlckNvbnRyb2xOZXh0O1xuXG4gICAgdGhpcy5zbGlkZXJDb250cm9sUGxheSA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3IoJy5qcy1zbGlkZXItY29udHJvbC1wbGF5Jyk7XG4gICAgdGhpcy5zbGlkZXJDb250cm9sUGF1c2UgPSB0aGlzLnNsaWRlci5xdWVyeVNlbGVjdG9yKCcuanMtc2xpZGVyLWNvbnRyb2wtcGF1c2UnKTtcbiAgICAvLyBmb3IgdGhlIGF1dG9wbGF5IHRvIHdvcmssIHBhdXNlIGFuZCBwbGF5ICptdXN0KiBiZSBwcmVzZW50LlxuICAgIHRoaXMuY2FuUGxheSA9ICEhdGhpcy5zbGlkZXJDb250cm9sUGxheSAmJiAhIXRoaXMuc2xpZGVyQ29udHJvbFBhdXNlO1xuXG4gICAgLy8gTk9URSB0aGUgc2xpZGVyIGluZGljYXRvcnMgc2hvdWxkIGJlIGRlZmluZWQgYXMgYSBjb250YWluZWQgc2V0IG9mXG4gICAgLy8gZWxlbWVudHMgKGVnIGA8YnV0dG9uPmBzIGluIGEgYDxmaWVsZHNldD5gKVxuICAgIHRoaXMuc2xpZGVySW5kaWNhdG9ycyA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3JBbGwoJy5qcy1zbGlkZXItaW5kaWNhdG9yJyk7XG4gICAgdGhpcy5zbGlkZXJJbmRpY2F0b3JzQ29udGFpbmVyID0gdGhpcy5zbGlkZXJJbmRpY2F0b3JzWzBdLnBhcmVudE5vZGU7XG4gICAgdGhpcy5oYXNJbmRpY2F0b3JzID0gdGhpcy5zbGlkZXJJbmRpY2F0b3JzLmxlbmd0aCA+IDA7XG5cbiAgICAvLyBTTGlkZXNob3cgc2hvdWxkIGltbWVkaWF0ZWx5IGJsb3cgdXAgaWYgdGhlcmUgYXJlIG5vIGNvbnRyb2xzIGxvY2F0ZWQ6XG4gICAgaWYgKCF0aGlzLmhhc0NvbnRyb2xzICYmICF0aGlzLmNhblBsYXkgJiYgIXRoaXMuaGFzSW5kaWNhdG9ycykgdGhyb3cgbmV3IEVycm9yKCdTbGlkZXIgY29udHJvbHMgY2Fubm90IGJlIGxvY2F0ZWQgaW4gdGhlIERPTScpO1xuXG4gICAgLy8gSWYgdGhlcmUgaXMgb25seSBvbmUgc2xpZGUgKG9yIG5vbmUpLCBubyBjb250cm9scyBzaG91bGQgYmUgcmVuZGVyZWRcbiAgICAvLyBldmVuIGlmIHRoZXkgYXJlIHByZXNlbnQgaW4gdGhlIERPTTpcbiAgICBpZiAodGhpcy5udW1TbGlkZXMgPCAyKSB7XG4gICAgICBpZiAodGhpcy5oYXNDb250cm9scykge1xuICAgICAgICBbdGhpcy5zbGlkZXJDb250cm9sUHJldiwgdGhpcy5zbGlkZXJDb250cm9sTmV4dF0uZm9yRWFjaChjdHJsID0+IGN0cmwuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJykpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuY2FuUGxheSkge1xuICAgICAgICBbdGhpcy5zbGlkZXJDb250cm9sUGxheSwgdGhpcy5zbGlkZXJDb250cm9sUGF1c2VdLmZvckVhY2goY3RybCA9PiBjdHJsLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmhhc0luZGljYXRvcnMpICB7XG4gICAgICAgIHRoaXMuc2xpZGVySW5kaWNhdG9yc0NvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsb2FkUmVtYWluaW5nU2xpZGVzKCkge1xuICAgIFsuLi50aGlzLnNsaWRlc0NvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdpbWdbZGF0YS1zcmNdJyldLmZvckVhY2goaW1nID0+IHtcbiAgICAgIGltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGltZy5kYXRhc2V0LnNyYyk7XG4gICAgICBpbWcub25sb2FkID0gKCkgPT4gaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zcmMnKTtcbiAgICB9KTtcbiAgfVxuXG4gIHNldHVwVHJhbnNpdGlvbnMoKSB7XG4gICAgLy8gVGhlIHNsaWRpbmcgdHJhbnNpdGlvbiBpcyBpbmhlcmVudGx5IHRpZWQgdG8gdGhlIHNsaWRlciBVSSxcbiAgICAvLyDiiLUgaXQgZGVwZW5kcyB1cG9uIGtub3dpbmcgbnVtYmVyIG9mIHNsaWRlczsg4oi0IHJlbmRlcmVkIGlubGluZVxuICAgIE9iamVjdC5hc3NpZ24odGhpcy5zbGlkZXNDb250YWluZXIuc3R5bGUsIHtcbiAgICAgIHdpZHRoOiBgJHt0aGlzLm51bVNsaWRlcyAqIDEwMH0lYCxcbiAgICAgIHRyYW5zaXRpb25EZWxheTogdGhpcy5vcHRzLnRyYW5zaXRpb25EZWxheSxcbiAgICAgIHRyYW5zaXRpb25EdXJhdGlvbjogdGhpcy5vcHRzLnRyYW5zaXRpb25EdXJhdGlvbixcbiAgICAgIHRyYW5zaXRpb25Qcm9wZXJ0eTogJ3RyYW5zZm9ybScsXG4gICAgICB0cmFuc2l0aW9uVGltaW5nRnVuY3Rpb246IHRoaXMub3B0cy50cmFuc2l0aW9uVGltaW5nRnVuY3Rpb24sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFwcGx5VHJhbnNsYXRpb24oKTtcbiAgfVxuXG4gIGFwcGx5VHJhbnNsYXRpb24oKSB7XG4gICAgY29uc3QgdHJhbnNsYXRpb24gPSBgdHJhbnNsYXRlWCgtJHsodGhpcy5jdXJyZW50U2xpZGUgLSAxKSAqICgxMDAgLyB0aGlzLm51bVNsaWRlcyl9JSlgO1xuICAgIHRoaXMuc2xpZGVzQ29udGFpbmVyLnN0eWxlLnRyYW5zZm9ybSA9IHRyYW5zbGF0aW9uO1xuICB9XG5cbiAgc2V0SW5kaWNhdG9yKCkge1xuICAgIFsuLi50aGlzLnNsaWRlckluZGljYXRvcnNdLmZvckVhY2goKGluZGljYXRvciwgaSkgPT4ge1xuICAgICAgaW5kaWNhdG9yLnNldEF0dHJpYnV0ZSgnYXJpYS1zZWxlY3RlZCcsIChpICsgMSA9PT0gdGhpcy5jdXJyZW50U2xpZGUpID8gJ3RydWUnIDogJ2ZhbHNlJyk7XG4gICAgfSk7XG4gIH1cblxuXG4gIHNob3dDdXJyZW50KCkge1xuICAgIC8vIFN3aXRjaCBhcmlhLWhpZGRlbiBvbiBhbmQgb2ZmIGZvciBhY2Nlc3NpYmlsaXR5IHJlYXNvbnMgLSB0aGVcbiAgICAvLyBub24tdmlzaWJsZSBzbGlkZXMgc2hvdWxkIGJlIGhpZGRlbiBmcm9tIGFjY2Vzc2liaWxpdHkgdG9vbHMuXG4gICAgWy4uLnRoaXMuc2xpZGVzXS5mb3JFYWNoKChzbGlkZSwgaSkgPT4ge1xuICAgICAgLy8gTk9URSBTbGlkZXMgYXJlIDEtaW5kZXhlZCwgc28gd2hlbiBsb29waW5nIHRocm91Z2ggdGhlXG4gICAgICAvLyBzbGlkZXMsIG5lZWQgdG8gY29tcGFyZSBhZ2FpbnN0IGkgKyAxLlxuICAgICAgc2xpZGUuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsIChpICsgMSA9PT0gdGhpcy5jdXJyZW50U2xpZGUpID8gJ2ZhbHNlJyA6ICd0cnVlJyk7XG4gICAgfSk7XG4gICAgdGhpcy5zZXRJbmRpY2F0b3IoKTtcbiAgICB0aGlzLmFwcGx5VHJhbnNsYXRpb24oKTtcbiAgfVxuXG4gIGhhbmRsZVNsaWRlVG8obikge1xuICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgIHRoaXMuY3VycmVudFNsaWRlID0gbjtcbiAgICB0aGlzLnNob3dDdXJyZW50KCk7XG4gICAgaWYgKHRoaXMuY2FuUGxheSAmJiB0aGlzLmlzUGxheWluZykgdGhpcy5oYW5kbGVQbGF5U2xpZGVzKCk7XG4gIH1cblxuICBoYW5kbGVJbmRpY2F0b3JTZWxlY3QoZSkge1xuICAgIGNvbnN0IHNlbGVjdGVkU2xpZGVJbmRleCA9IFsuLi50aGlzLnNsaWRlckluZGljYXRvcnNDb250YWluZXIuY2hpbGRyZW5dLmluZGV4T2YoZS50YXJnZXQpO1xuICAgIHRoaXMuaGFuZGxlU2xpZGVUbyhzZWxlY3RlZFNsaWRlSW5kZXggKyAxKTtcbiAgfVxuXG4gIGhhbmRsZU5leHRTbGlkZShlKSB7XG4gICAgdGhpcy5oYW5kbGVTbGlkZVRvKCh0aGlzLmN1cnJlbnRTbGlkZSArIDEgPiB0aGlzLm51bVNsaWRlcykgPyAxIDogdGhpcy5jdXJyZW50U2xpZGUgKyAxKTtcbiAgfVxuXG4gIGhhbmRsZVByZXZTbGlkZShlKSB7XG4gICAgdGhpcy5oYW5kbGVTbGlkZVRvKCh0aGlzLmN1cnJlbnRTbGlkZSAtIDEgPT09IDApID8gdGhpcy5udW1TbGlkZXMgOiB0aGlzLmN1cnJlbnRTbGlkZSAtIDEpO1xuICB9XG5cbiAgaGFuZGxlUGxheVNsaWRlcyhlKSB7XG4gICAgdGhpcy5zbGlkZXJDb250cm9sUGxheS5kaXNhYmxlZCA9IHRydWU7XG4gICAgdGhpcy5pc1BsYXlpbmcgPSB0cnVlO1xuICAgIHRoaXMuaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmhhbmRsZU5leHRTbGlkZSgpLCB0aGlzLm9wdHMuaW50ZXJ2YWxUaW1lKTtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQYXVzZS5kaXNhYmxlZCA9IGZhbHNlO1xuICB9XG5cbiAgaGFuZGxlUGF1c2VTbGlkZXMoZSkge1xuICAgIHRoaXMuc2xpZGVyQ29udHJvbFBhdXNlLmRpc2FibGVkID0gdHJ1ZTtcbiAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgIHRoaXMuaW50ZXJ2YWwgPSB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQbGF5LmRpc2FibGVkID0gZmFsc2U7XG4gIH1cblxuICBiaW5kRXZlbnRzKCkge1xuICAgIHRoaXMuc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICAgICAgY2FzZSBlLnRhcmdldCA9PSB0aGlzLnNsaWRlckNvbnRyb2xQcmV2OiB0aGlzLmhhbmRsZVByZXZTbGlkZShlKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgZS50YXJnZXQgPT0gdGhpcy5zbGlkZXJDb250cm9sTmV4dDogdGhpcy5oYW5kbGVOZXh0U2xpZGUoZSk7IGJyZWFrO1xuICAgICAgICBjYXNlIGUudGFyZ2V0ID09IHRoaXMuc2xpZGVyQ29udHJvbFBsYXk6IHRoaXMuaGFuZGxlUGxheVNsaWRlcyhlKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgZS50YXJnZXQgPT0gdGhpcy5zbGlkZXJDb250cm9sUGF1c2U6IHRoaXMuaGFuZGxlUGF1c2VTbGlkZXMoZSk7IGJyZWFrO1xuICAgICAgICBjYXNlIHRoaXMuc2xpZGVySW5kaWNhdG9yc0NvbnRhaW5lci5jb250YWlucyhlLnRhcmdldCk6IHRoaXMuaGFuZGxlSW5kaWNhdG9yU2VsZWN0KGUpOyBicmVhaztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE9uY2UgZXZlcnl0aGluZyBvbiB0aGUgcGFnZSwgaW5jbHVkaW5nIGltYWdlcywgaGFzIGxvYWRlZCwgbG9hZCB0aGVcbiAgICAvLyByZW1haW5pbmcgc2xpZGUgaW1hZ2VzIGFuZCBzdGFydCBwbGF5aW5nIHNsaWRlcyBpZiBhdXRvcGxheSBvcHRpb24gaXMgdHJ1ZTpcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHtcbiAgICAgIHRoaXMubG9hZFJlbWFpbmluZ1NsaWRlcygpO1xuICAgICAgc3dpdGNoICh0aGlzLm9wdHMuYXV0b3BsYXkpIHtcbiAgICAgICAgY2FzZSAndHJ1ZSc6IHRoaXMuaGFuZGxlUGxheVNsaWRlcygpOyBicmVhaztcbiAgICAgICAgY2FzZSAnZmFsc2UnOiB0aGlzLmhhbmRsZVBhdXNlU2xpZGVzKCk7IGJyZWFrO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iXX0=