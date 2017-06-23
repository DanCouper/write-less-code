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
    this.slidesContainer = this.slider.querySelector('.slides');
    this.slides = this.slider.querySelectorAll('.slide');

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
      this.sliderControlPrev = this.slider.querySelector('.slider-control-prev');
      this.sliderControlNext = this.slider.querySelector('.slider-control-next');
      // For the controls to work, both prev and next *must* be present.
      this.hasControls = !!this.sliderControlPrev && !!this.sliderControlNext;

      this.sliderControlPlay = this.slider.querySelector('.slider-control-play');
      this.sliderControlPause = this.slider.querySelector('.slider-control-pause');
      // for the autoplay to work, pause and play *must* be present.
      this.canPlay = !!this.sliderControlPlay && !!this.sliderControlPause;

      // NOTE the slider indicators should be defined as a contained set of
      // elements (eg `<button>`s in a `<fieldset>`)
      this.sliderIndicators = this.slider.querySelectorAll('.slider-indicator');
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
          case e.target === _this4.sliderControlPrev:
            _this4.handlePrevSlide(e);break;
          case e.target === _this4.sliderControlNext:
            _this4.handleNextSlide(e);break;
          case e.target === _this4.sliderControlPlay:
            _this4.handlePlaySlides(e);break;
          case e.target === _this4.sliderControlPause:
            _this4.handlePauseSlides(e);break;
          case _this4.sliderIndicatorsContainer.contains(e.target):
            _this4.handleIndicatorSelect(e);break;
          default:
            noop();
        }
      });

      // Once everything on the page, including images, has loaded, load the
      // remaining slide images and start playing slides if autoplay option is true:
      window.addEventListener('load', function () {
        _this4.loadRemainingSlides();
        if (_this4.opts.autoplay === 'true') _this4.handlePlaySlides();
      });
    }
  }]);

  return Slider;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qcy1jYXJvdXNlbC9zbGlkZXIuanMiXSwibmFtZXMiOlsibm9vcCIsIlNsaWRlciIsImVsZW1lbnQiLCJzbGlkZXIiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJzbGlkZXNDb250YWluZXIiLCJzbGlkZXMiLCJxdWVyeVNlbGVjdG9yQWxsIiwib3B0cyIsIk9iamVjdCIsImFzc2lnbiIsImF1dG9wbGF5IiwiaW50ZXJ2YWxUaW1lIiwidHJhbnNpdGlvbkRlbGF5IiwidHJhbnNpdGlvbkR1cmF0aW9uIiwidHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uIiwiZGF0YXNldCIsImN1cnJlbnRTbGlkZSIsIm51bVNsaWRlcyIsImxlbmd0aCIsImlzUGxheWluZyIsImludGVydmFsIiwic2V0dXBDb250cm9scyIsInNldHVwVHJhbnNpdGlvbnMiLCJiaW5kRXZlbnRzIiwic2xpZGVyQ29udHJvbFByZXYiLCJzbGlkZXJDb250cm9sTmV4dCIsImhhc0NvbnRyb2xzIiwic2xpZGVyQ29udHJvbFBsYXkiLCJzbGlkZXJDb250cm9sUGF1c2UiLCJjYW5QbGF5Iiwic2xpZGVySW5kaWNhdG9ycyIsInNsaWRlckluZGljYXRvcnNDb250YWluZXIiLCJwYXJlbnROb2RlIiwiaGFzSW5kaWNhdG9ycyIsIkVycm9yIiwiZm9yRWFjaCIsImN0cmwiLCJzZXRBdHRyaWJ1dGUiLCJpbWciLCJzcmMiLCJvbmxvYWQiLCJyZW1vdmVBdHRyaWJ1dGUiLCJzdHlsZSIsIndpZHRoIiwidHJhbnNpdGlvblByb3BlcnR5IiwiYXBwbHlUcmFuc2xhdGlvbiIsInRyYW5zbGF0aW9uIiwidHJhbnNmb3JtIiwiaW5kaWNhdG9yIiwiaSIsInNsaWRlIiwic2V0SW5kaWNhdG9yIiwibiIsIndpbmRvdyIsImNsZWFySW50ZXJ2YWwiLCJzaG93Q3VycmVudCIsImhhbmRsZVBsYXlTbGlkZXMiLCJlIiwic2VsZWN0ZWRTbGlkZUluZGV4IiwiY2hpbGRyZW4iLCJpbmRleE9mIiwidGFyZ2V0IiwiaGFuZGxlU2xpZGVUbyIsImRpc2FibGVkIiwic2V0SW50ZXJ2YWwiLCJoYW5kbGVOZXh0U2xpZGUiLCJhZGRFdmVudExpc3RlbmVyIiwiaGFuZGxlUHJldlNsaWRlIiwiaGFuZGxlUGF1c2VTbGlkZXMiLCJjb250YWlucyIsImhhbmRsZUluZGljYXRvclNlbGVjdCIsImxvYWRSZW1haW5pbmdTbGlkZXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsU0FBU0EsSUFBVCxHQUFnQjtBQUFFLFNBQU8sS0FBSyxDQUFaO0FBQWdCO0FBQ2xDOzs7Ozs7Ozs7SUFTTUMsTTtBQUNKLGtCQUFZQyxPQUFaLEVBQXFCO0FBQUE7O0FBRW5CO0FBQ0EsU0FBS0MsTUFBTCxHQUFjQyxTQUFTQyxhQUFULENBQXVCSCxPQUF2QixDQUFkO0FBQ0EsU0FBS0ksZUFBTCxHQUF1QixLQUFLSCxNQUFMLENBQVlFLGFBQVosQ0FBMEIsU0FBMUIsQ0FBdkI7QUFDQSxTQUFLRSxNQUFMLEdBQWMsS0FBS0osTUFBTCxDQUFZSyxnQkFBWixDQUE2QixRQUE3QixDQUFkOztBQUVBO0FBQ0EsU0FBS0MsSUFBTCxHQUFZQyxPQUFPQyxNQUFQLENBQWM7QUFDeEJDLGdCQUFVLE1BRGM7QUFFeEJDLG9CQUFjLElBRlU7QUFHeEJDLHVCQUFpQixJQUhPO0FBSXhCQywwQkFBb0IsTUFKSTtBQUt4QkMsZ0NBQTBCO0FBTEYsS0FBZCxFQU1ULEtBQUtiLE1BQUwsQ0FBWWMsT0FOSCxDQUFaOztBQVFBO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQixDQUFwQixDQWpCbUIsQ0FpQkk7QUFDdkIsU0FBS0MsU0FBTCxHQUFpQixLQUFLWixNQUFMLENBQVlhLE1BQTdCO0FBQ0EsU0FBS0MsU0FBTCxHQUFpQixLQUFqQixDQW5CbUIsQ0FtQks7QUFDeEIsU0FBS0MsUUFBTCxDQXBCbUIsQ0FvQko7O0FBRWY7QUFDQSxTQUFLQyxhQUFMO0FBQ0EsU0FBS0MsZ0JBQUw7QUFDQSxTQUFLQyxVQUFMO0FBQ0Q7Ozs7b0NBRWU7QUFDZDs7QUFFQTtB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QUFBMEMsbUJBQUs2QixnQkFBTCxDQUFzQkMsQ0FBdEIsRUFBMEI7QUFDcEUsZUFBS0EsRUFBRUksTUFBRixLQUFhLE9BQUtqQyxrQkFBdkI7QUFBMkMsbUJBQUt3QyxpQkFBTCxDQUF1QlgsQ0FBdkIsRUFBMkI7QUFDdEUsZUFBSyxPQUFLMUIseUJBQUwsQ0FBK0JzQyxRQUEvQixDQUF3Q1osRUFBRUksTUFBMUMsQ0FBTDtBQUF3RCxtQkFBS1MscUJBQUwsQ0FBMkJiLENBQTNCLEVBQStCO0FBQ3ZGO0FBQVMzRDtBQU5YO0FBUUQsT0FURDs7QUFXQTtBQUNBO0FBQ0F1RCxhQUFPYSxnQkFBUCxDQUF3QixNQUF4QixFQUFnQyxZQUFNO0FBQ3BDLGVBQUtLLG1CQUFMO0FBQ0EsWUFBSSxPQUFLaEUsSUFBTCxDQUFVRyxRQUFWLEtBQXVCLE1BQTNCLEVBQW1DLE9BQUs4QyxnQkFBTDtBQUNwQyxPQUhEO0FBSUQiLCJmaWxlIjoic2xpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gbm9vcCgpIHsgcmV0dXJuIHZvaWQgMDsgfVxuLyoqXG4gKiBDcmVhdGVzIGFuZCBpbml0aWFsaXNlcyBhIHNsaWRlci4gSWYgdGhlIHNsaWRlciBpcyBub3RcbiAqIGZ1bGx5IGluaXRpYWxpc2VkLCB0aGUgcGFnZSBzaG91b2xkIGp1c3QgcmVuZGVyIGEgc2luZ2xlIHNsaWRlLFxuICogd2l0aCBubyBjb250cm9scy5cbiAqXG4gKiBSRVZJRVcgYWxsIHNsaWRlLXRvIGNvZGUgc2hvdWxkIGJlIGluIG9uZSBoYW5kbGVyLCBjYWxsIHRoYXQgd2l0aCBwYXJhbXNcbiAqIFJFVklFVyB0b28gbXVjaCBzdGF0ZSwgcmVkdWNlIGlmIHBvc3NcbiAqL1xuXG5jbGFzcyBTbGlkZXIge1xuICBjb25zdHJ1Y3RvcihlbGVtZW50KSB7XG5cbiAgICAvLyBET00gc2VsZWN0aW9uOlxuICAgIHRoaXMuc2xpZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtZW50KTtcbiAgICB0aGlzLnNsaWRlc0NvbnRhaW5lciA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3IoJy5zbGlkZXMnKTtcbiAgICB0aGlzLnNsaWRlcyA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zbGlkZScpO1xuXG4gICAgLy8gT3ZlcndyaXRlIHRoZSBzbGlkZXIgZGVmYXVsdHMgd2l0aCBhbnl0aGluZyBwYXNzZWQgaW4gYXMgZGF0YSBhdHRyaWJ1dGVzOlxuICAgIHRoaXMub3B0cyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgYXV0b3BsYXk6ICd0cnVlJyxcbiAgICAgIGludGVydmFsVGltZTogNDAwMCxcbiAgICAgIHRyYW5zaXRpb25EZWxheTogJzBzJyxcbiAgICAgIHRyYW5zaXRpb25EdXJhdGlvbjogJy43NXMnLFxuICAgICAgdHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uOiAnY3ViaWMtYmV6aWVyKDAuNTUwLCAwLjA1NSwgMC42NzUsIDAuMTkwKSdcbiAgICB9LCB0aGlzLnNsaWRlci5kYXRhc2V0KTtcblxuICAgIC8vIFNldCB1cCByZW1haW5pbmcgbmVjZXNzYXJ5IHN0YXRlOlxuICAgIHRoaXMuY3VycmVudFNsaWRlID0gMTsgLy8gVGhlIHNsaWRlcyBhcmUgMS1pbmRleGVkLCBhbmQgY3VycmVudCBzbGlkZSBhbHdheXMgc3RhcnRzIGF0IDFcbiAgICB0aGlzLm51bVNsaWRlcyA9IHRoaXMuc2xpZGVzLmxlbmd0aDtcbiAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlOyAvLyB1c2UgdG8gY2hlY2sgaWYgYXV0b3BsYXkgdGltZXIgc2hvdWxkIGJlIHJlc2V0IHdoZW4gbmV4dC9wcmV2IHNsaWRlIGlzIGNsaWNrZWRcbiAgICB0aGlzLmludGVydmFsOyAvLyBpbml0aWFsbHkgdW5kZWZpbmVkIHJlZmVyZW5jZSB1c2VkIGZvciB0aGUgaW50ZXJ2YWwgdXNlZCBwbGF5aW5nIHRoZSBzbGlkZXNob3dcblxuICAgIC8vIEluaXRpYWxpc2U6XG4gICAgdGhpcy5zZXR1cENvbnRyb2xzKCk7XG4gICAgdGhpcy5zZXR1cFRyYW5zaXRpb25zKCk7XG4gICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gIH1cblxuICBzZXR1cENvbnRyb2xzKCkge1xuICAgIC8vIERPTSBjb250cm9scyAodGhlc2UgbWF5IG5vdCBleGlzdCk6XG5cbiAgICAvLyBOT1RFIHByZXZpb3VzL25leHQvcGxheS9wYXVzZSBjb250cm9scyBhcmUgYWxsIGRlZmluZWQgc2VwZXJhdGVseVxuICAgIC8vIHRvIGFsbG93IHRoZW0gdG8gYmUgcGxhY2VkIGFueXdoZXJlIHdpdGhpbiB0aGUgc2xpZGVyIG1hcmt1cFxuICAgIC8vIGFuZCBzdHlsZWQgaW5kaXZpZHVhbGx5XG4gICAgdGhpcy5zbGlkZXJDb250cm9sUHJldiA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3IoJy5zbGlkZXItY29udHJvbC1wcmV2Jyk7XG4gICAgdGhpcy5zbGlkZXJDb250cm9sTmV4dCA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3IoJy5zbGlkZXItY29udHJvbC1uZXh0Jyk7XG4gICAgLy8gRm9yIHRoZSBjb250cm9scyB0byB3b3JrLCBib3RoIHByZXYgYW5kIG5leHQgKm11c3QqIGJlIHByZXNlbnQuXG4gICAgdGhpcy5oYXNDb250cm9scyA9ICEhdGhpcy5zbGlkZXJDb250cm9sUHJldiAmJiAhIXRoaXMuc2xpZGVyQ29udHJvbE5leHQ7XG5cbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQbGF5ID0gdGhpcy5zbGlkZXIucXVlcnlTZWxlY3RvcignLnNsaWRlci1jb250cm9sLXBsYXknKTtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQYXVzZSA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3IoJy5zbGlkZXItY29udHJvbC1wYXVzZScpO1xuICAgIC8vIGZvciB0aGUgYXV0b3BsYXkgdG8gd29yaywgcGF1c2UgYW5kIHBsYXkgKm11c3QqIGJlIHByZXNlbnQuXG4gICAgdGhpcy5jYW5QbGF5ID0gISF0aGlzLnNsaWRlckNvbnRyb2xQbGF5ICYmICEhdGhpcy5zbGlkZXJDb250cm9sUGF1c2U7XG5cbiAgICAvLyBOT1RFIHRoZSBzbGlkZXIgaW5kaWNhdG9ycyBzaG91bGQgYmUgZGVmaW5lZCBhcyBhIGNvbnRhaW5lZCBzZXQgb2ZcbiAgICAvLyBlbGVtZW50cyAoZWcgYDxidXR0b24+YHMgaW4gYSBgPGZpZWxkc2V0PmApXG4gICAgdGhpcy5zbGlkZXJJbmRpY2F0b3JzID0gdGhpcy5zbGlkZXIucXVlcnlTZWxlY3RvckFsbCgnLnNsaWRlci1pbmRpY2F0b3InKTtcbiAgICB0aGlzLnNsaWRlckluZGljYXRvcnNDb250YWluZXIgPSB0aGlzLnNsaWRlckluZGljYXRvcnNbMF0ucGFyZW50Tm9kZTtcbiAgICB0aGlzLmhhc0luZGljYXRvcnMgPSB0aGlzLnNsaWRlckluZGljYXRvcnMubGVuZ3RoID4gMDtcblxuICAgIC8vIFNMaWRlc2hvdyBzaG91bGQgaW1tZWRpYXRlbHkgYmxvdyB1cCBpZiB0aGVyZSBhcmUgbm8gY29udHJvbHMgbG9jYXRlZDpcbiAgICBpZiAoIXRoaXMuaGFzQ29udHJvbHMgJiYgIXRoaXMuY2FuUGxheSAmJiAhdGhpcy5oYXNJbmRpY2F0b3JzKSB0aHJvdyBuZXcgRXJyb3IoJ1NsaWRlciBjb250cm9scyBjYW5ub3QgYmUgbG9jYXRlZCBpbiB0aGUgRE9NJyk7XG5cbiAgICAvLyBJZiB0aGVyZSBpcyBvbmx5IG9uZSBzbGlkZSAob3Igbm9uZSksIG5vIGNvbnRyb2xzIHNob3VsZCBiZSByZW5kZXJlZFxuICAgIC8vIGV2ZW4gaWYgdGhleSBhcmUgcHJlc2VudCBpbiB0aGUgRE9NOlxuICAgIGlmICh0aGlzLm51bVNsaWRlcyA8IDIpIHtcbiAgICAgIGlmICh0aGlzLmhhc0NvbnRyb2xzKSB7XG4gICAgICAgIFt0aGlzLnNsaWRlckNvbnRyb2xQcmV2LCB0aGlzLnNsaWRlckNvbnRyb2xOZXh0XS5mb3JFYWNoKGN0cmwgPT4gY3RybC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKSk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5jYW5QbGF5KSB7XG4gICAgICAgIFt0aGlzLnNsaWRlckNvbnRyb2xQbGF5LCB0aGlzLnNsaWRlckNvbnRyb2xQYXVzZV0uZm9yRWFjaChjdHJsID0+IGN0cmwuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJykpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaGFzSW5kaWNhdG9ycykgIHtcbiAgICAgICAgdGhpcy5zbGlkZXJJbmRpY2F0b3JzQ29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxvYWRSZW1haW5pbmdTbGlkZXMoKSB7XG4gICAgWy4uLnRoaXMuc2xpZGVzQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZ1tkYXRhLXNyY10nKV0uZm9yRWFjaChpbWcgPT4ge1xuICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgaW1nLmRhdGFzZXQuc3JjKTtcbiAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiBpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNyYycpO1xuICAgIH0pO1xuICB9XG5cbiAgc2V0dXBUcmFuc2l0aW9ucygpIHtcbiAgICAvLyBUaGUgc2xpZGluZyB0cmFuc2l0aW9uIGlzIGluaGVyZW50bHkgdGllZCB0byB0aGUgc2xpZGVyIFVJLFxuICAgIC8vIOKItSBpdCBkZXBlbmRzIHVwb24ga25vd2luZyBudW1iZXIgb2Ygc2xpZGVzOyDiiLQgcmVuZGVyZWQgaW5saW5lXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLnNsaWRlc0NvbnRhaW5lci5zdHlsZSwge1xuICAgICAgd2lkdGg6IGAke3RoaXMubnVtU2xpZGVzICogMTAwfSVgLFxuICAgICAgdHJhbnNpdGlvbkRlbGF5OiB0aGlzLm9wdHMudHJhbnNpdGlvbkRlbGF5LFxuICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uOiB0aGlzLm9wdHMudHJhbnNpdGlvbkR1cmF0aW9uLFxuICAgICAgdHJhbnNpdGlvblByb3BlcnR5OiAndHJhbnNmb3JtJyxcbiAgICAgIHRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbjogdGhpcy5vcHRzLnRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbixcbiAgICB9KTtcblxuICAgIHRoaXMuYXBwbHlUcmFuc2xhdGlvbigpO1xuICB9XG5cbiAgYXBwbHlUcmFuc2xhdGlvbigpIHtcbiAgICBjb25zdCB0cmFuc2xhdGlvbiA9IGB0cmFuc2xhdGVYKC0keyh0aGlzLmN1cnJlbnRTbGlkZSAtIDEpICogKDEwMCAvIHRoaXMubnVtU2xpZGVzKX0lKWA7XG4gICAgdGhpcy5zbGlkZXNDb250YWluZXIuc3R5bGUudHJhbnNmb3JtID0gdHJhbnNsYXRpb247XG4gIH1cblxuICBzZXRJbmRpY2F0b3IoKSB7XG4gICAgWy4uLnRoaXMuc2xpZGVySW5kaWNhdG9yc10uZm9yRWFjaCgoaW5kaWNhdG9yLCBpKSA9PiB7XG4gICAgICBpbmRpY2F0b3Iuc2V0QXR0cmlidXRlKCdhcmlhLXNlbGVjdGVkJywgKGkgKyAxID09PSB0aGlzLmN1cnJlbnRTbGlkZSkgPyAndHJ1ZScgOiAnZmFsc2UnKTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgc2hvd0N1cnJlbnQoKSB7XG4gICAgLy8gU3dpdGNoIGFyaWEtaGlkZGVuIG9uIGFuZCBvZmYgZm9yIGFjY2Vzc2liaWxpdHkgcmVhc29ucyAtIHRoZVxuICAgIC8vIG5vbi12aXNpYmxlIHNsaWRlcyBzaG91bGQgYmUgaGlkZGVuIGZyb20gYWNjZXNzaWJpbGl0eSB0b29scy5cbiAgICBbLi4udGhpcy5zbGlkZXNdLmZvckVhY2goKHNsaWRlLCBpKSA9PiB7XG4gICAgICAvLyBOT1RFIFNsaWRlcyBhcmUgMS1pbmRleGVkLCBzbyB3aGVuIGxvb3BpbmcgdGhyb3VnaCB0aGVcbiAgICAgIC8vIHNsaWRlcywgbmVlZCB0byBjb21wYXJlIGFnYWluc3QgaSArIDEuXG4gICAgICBzbGlkZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgKGkgKyAxID09PSB0aGlzLmN1cnJlbnRTbGlkZSkgPyAnZmFsc2UnIDogJ3RydWUnKTtcbiAgICB9KTtcbiAgICB0aGlzLnNldEluZGljYXRvcigpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2xhdGlvbigpO1xuICB9XG5cbiAgaGFuZGxlU2xpZGVUbyhuKSB7XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG4gICAgdGhpcy5jdXJyZW50U2xpZGUgPSBuO1xuICAgIHRoaXMuc2hvd0N1cnJlbnQoKTtcbiAgICBpZiAodGhpcy5jYW5QbGF5ICYmIHRoaXMuaXNQbGF5aW5nKSB0aGlzLmhhbmRsZVBsYXlTbGlkZXMoKTtcbiAgfVxuXG4gIGhhbmRsZUluZGljYXRvclNlbGVjdChlKSB7XG4gICAgY29uc3Qgc2VsZWN0ZWRTbGlkZUluZGV4ID0gWy4uLnRoaXMuc2xpZGVySW5kaWNhdG9yc0NvbnRhaW5lci5jaGlsZHJlbl0uaW5kZXhPZihlLnRhcmdldCk7XG4gICAgdGhpcy5oYW5kbGVTbGlkZVRvKHNlbGVjdGVkU2xpZGVJbmRleCArIDEpO1xuICB9XG5cbiAgaGFuZGxlTmV4dFNsaWRlKGUpIHtcbiAgICB0aGlzLmhhbmRsZVNsaWRlVG8oKHRoaXMuY3VycmVudFNsaWRlICsgMSA+IHRoaXMubnVtU2xpZGVzKSA/IDEgOiB0aGlzLmN1cnJlbnRTbGlkZSArIDEpO1xuICB9XG5cbiAgaGFuZGxlUHJldlNsaWRlKGUpIHtcbiAgICB0aGlzLmhhbmRsZVNsaWRlVG8oKHRoaXMuY3VycmVudFNsaWRlIC0gMSA9PT0gMCkgPyB0aGlzLm51bVNsaWRlcyA6IHRoaXMuY3VycmVudFNsaWRlIC0gMSk7XG4gIH1cblxuICBoYW5kbGVQbGF5U2xpZGVzKGUpIHtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQbGF5LmRpc2FibGVkID0gdHJ1ZTtcbiAgICB0aGlzLmlzUGxheWluZyA9IHRydWU7XG4gICAgdGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHRoaXMuaGFuZGxlTmV4dFNsaWRlKCksIHRoaXMub3B0cy5pbnRlcnZhbFRpbWUpO1xuICAgIHRoaXMuc2xpZGVyQ29udHJvbFBhdXNlLmRpc2FibGVkID0gZmFsc2U7XG4gIH1cblxuICBoYW5kbGVQYXVzZVNsaWRlcyhlKSB7XG4gICAgdGhpcy5zbGlkZXJDb250cm9sUGF1c2UuZGlzYWJsZWQgPSB0cnVlO1xuICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XG4gICAgdGhpcy5pbnRlcnZhbCA9IHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgIHRoaXMuc2xpZGVyQ29udHJvbFBsYXkuZGlzYWJsZWQgPSBmYWxzZTtcbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG4gICAgdGhpcy5zbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgICBjYXNlIGUudGFyZ2V0ID09PSB0aGlzLnNsaWRlckNvbnRyb2xQcmV2OiB0aGlzLmhhbmRsZVByZXZTbGlkZShlKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgZS50YXJnZXQgPT09IHRoaXMuc2xpZGVyQ29udHJvbE5leHQ6IHRoaXMuaGFuZGxlTmV4dFNsaWRlKGUpOyBicmVhaztcbiAgICAgICAgY2FzZSBlLnRhcmdldCA9PT0gdGhpcy5zbGlkZXJDb250cm9sUGxheTogdGhpcy5oYW5kbGVQbGF5U2xpZGVzKGUpOyBicmVhaztcbiAgICAgICAgY2FzZSBlLnRhcmdldCA9PT0gdGhpcy5zbGlkZXJDb250cm9sUGF1c2U6IHRoaXMuaGFuZGxlUGF1c2VTbGlkZXMoZSk7IGJyZWFrO1xuICAgICAgICBjYXNlIHRoaXMuc2xpZGVySW5kaWNhdG9yc0NvbnRhaW5lci5jb250YWlucyhlLnRhcmdldCk6IHRoaXMuaGFuZGxlSW5kaWNhdG9yU2VsZWN0KGUpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDogbm9vcCgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gT25jZSBldmVyeXRoaW5nIG9uIHRoZSBwYWdlLCBpbmNsdWRpbmcgaW1hZ2VzLCBoYXMgbG9hZGVkLCBsb2FkIHRoZVxuICAgIC8vIHJlbWFpbmluZyBzbGlkZSBpbWFnZXMgYW5kIHN0YXJ0IHBsYXlpbmcgc2xpZGVzIGlmIGF1dG9wbGF5IG9wdGlvbiBpcyB0cnVlOlxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xuICAgICAgdGhpcy5sb2FkUmVtYWluaW5nU2xpZGVzKCk7XG4gICAgICBpZiAodGhpcy5vcHRzLmF1dG9wbGF5ID09PSAndHJ1ZScpIHRoaXMuaGFuZGxlUGxheVNsaWRlcygpO1xuICAgIH0pO1xuICB9XG59XG4iXX0=