'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Creates and initialises a slider. If the slider is not
 * fully initialised, the page shouold just render a single slide,
 * with no controls.
 */

var Slider = function () {
  function Slider(element) {
    _classCallCheck(this, Slider);

    // DOM selection:
    this.slider = document.querySelector(element);
    this.slidesContainer = this.slider.querySelector('.slides');
    this.slides = this.slider.getElementsByClassName('slide');

    // DOM controls, undefined until controls are loaded (these may not exist):
    this.sliderControlPrev = this.slider.querySelector('.slider-control-prev');
    this.sliderControlNext = this.slider.querySelector('.slider-control-next');
    this.sliderControlPlay = this.slider.querySelector('.slider-control-play');
    this.sliderControlPause = this.slider.querySelector('.slider-control-pause');
    this.sliderIndicators = this.slider.querySelectorAll('.slider-indicator');
    this.sliderIndicatorsContainer = this.sliderIndicators[0].parentNode;

    // For the controls to work, both prev and next *must* be present.
    // for the autoplay to work, pause and play *must* be present.
    this.hasControls = !!this.sliderControlPrev && !!this.sliderControlNext;
    this.canAutoplay = !!this.sliderControlPlay && !!this.sliderControlPause;
    this.hasIndicators = this.sliderIndicators.length > 0;
    // Immediately blow up if there are no controls at all:
    if (!this.hasControls && !this.canAutoplay && !this.hasIndicators) throw new Error('Slider controls cannot be located in the DOM');

    // Overwrite the slider defaults with anything passed in from data attributes:
    this.opts = Object.assign({
      intervalTime: 4000,
      transitionDelay: '0s',
      transitionDuration: '.75s',
      transitionTimingFunction: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)'
    }, this.slider.dataset);

    // Set up remaining necessary state:
    this.currentSlide = 1; // The slides are 1-indexed, and current slide always starts at 1
    this.numSlides = this.slides.length;
    this.isPlaying = false; // use to check if autoplay timer should be reset when next/prev slide is clicked
    this.interval; // initially undefined, reference used to the autoplay interval
  }

  _createClass(Slider, [{
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
    key: 'loadControls',
    value: function loadControls() {
      // If there is only one slide (or none), no controls need be rendered:
      if (this.numSlides < 2) {
        if (this.hasControls) {
          [this.sliderControlPrev, this.sliderControlNext].forEach(function (ctrl) {
            return ctrl.setAttribute('aria-hidden', 'true');
          });
        }
        if (this.canAutoplay) {
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
    key: 'handleIndicatorSelect',
    value: function handleIndicatorSelect(e) {
      window.clearInterval(this.interval);
      var selectedSlideIndex = [].concat(_toConsumableArray(this.sliderIndicatorsContainer.children)).indexOf(e.target);
      this.currentSlide = selectedSlideIndex + 1;
      this.showCurrent();
      if (this.canAutoplay && this.isPlaying) this.handlePlaySlides();
    }
  }, {
    key: 'handleNextSlide',
    value: function handleNextSlide(e) {
      window.clearInterval(this.interval);
      this.currentSlide = this.currentSlide + 1 > this.numSlides ? 1 : this.currentSlide + 1;
      this.showCurrent();
      if (this.canAutoplay && this.isPlaying) this.handlePlaySlides();
    }
  }, {
    key: 'handlePrevSlide',
    value: function handlePrevSlide(e) {
      window.clearInterval(this.interval);
      this.currentSlide = this.currentSlide - 1 === 0 ? this.numSlides : this.currentSlide - 1;
      this.showCurrent();
      if (this.canAutoplay && this.isPlaying) this.handlePlaySlides();
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
        }
      });

      // Set up the autoplay after everything, including images, has loaded:
      window.addEventListener('load', function () {
        _this4.loadRemainingSlides();
        if (_this4.canAutoplay) _this4.handlePlaySlides();
      });
    }
  }, {
    key: 'init',
    value: function init() {
      this.loadControls();
      this.setupTransitions();
      this.bindEvents();
    }
  }]);

  return Slider;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qcy1jYXJvdXNlbC9zbGlkZXIuanMiXSwibmFtZXMiOlsiU2xpZGVyIiwiZWxlbWVudCIsInNsaWRlciIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsInNsaWRlc0NvbnRhaW5lciIsInNsaWRlcyIsImdldEVsZW1lbnRzQnlDbGFzc05hbWUiLCJzbGlkZXJDb250cm9sUHJldiIsInNsaWRlckNvbnRyb2xOZXh0Iiwic2xpZGVyQ29udHJvbFBsYXkiLCJzbGlkZXJDb250cm9sUGF1c2UiLCJzbGlkZXJJbmRpY2F0b3JzIiwicXVlcnlTZWxlY3RvckFsbCIsInNsaWRlckluZGljYXRvcnNDb250YWluZXIiLCJwYXJlbnROb2RlIiwiaGFzQ29udHJvbHMiLCJjYW5BdXRvcGxheSIsImhhc0luZGljYXRvcnMiLCJsZW5ndGgiLCJFcnJvciIsIm9wdHMiLCJPYmplY3QiLCJhc3NpZ24iLCJpbnRlcnZhbFRpbWUiLCJ0cmFuc2l0aW9uRGVsYXkiLCJ0cmFuc2l0aW9uRHVyYXRpb24iLCJ0cmFuc2l0aW9uVGltaW5nRnVuY3Rpb24iLCJkYXRhc2V0IiwiY3VycmVudFNsaWRlIiwibnVtU2xpZGVzIiwiaXNQbGF5aW5nIiwiaW50ZXJ2YWwiLCJmb3JFYWNoIiwiaW1nIiwic2V0QXR0cmlidXRlIiwic3JjIiwib25sb2FkIiwicmVtb3ZlQXR0cmlidXRlIiwiY3RybCIsInN0eWxlIiwid2lkdGgiLCJ0cmFuc2l0aW9uUHJvcGVydHkiLCJhcHBseVRyYW5zbGF0aW9uIiwidHJhbnNsYXRpb24iLCJ0cmFuc2Zvcm0iLCJpbmRpY2F0b3IiLCJpIiwic2xpZGUiLCJzZXRJbmRpY2F0b3IiLCJlIiwid2luZG93IiwiY2xlYXJJbnRlcnZhbCIsInNlbGVjdGVkU2xpZGVJbmRleCIsImNoaWxkcmVuIiwiaW5kZXhPZiIsInRhcmdldCIsInNob3dDdXJyZW50IiwiaGFuZGxlUGxheVNsaWRlcyIsImRpc2FibGVkIiwic2V0SW50ZXJ2YWwiLCJoYW5kbGVOZXh0U2xpZGUiLCJhZGRFdmVudExpc3RlbmVyIiwiaGFuZGxlUHJldlNsaWRlIiwiaGFuZGxlUGF1c2VTbGlkZXMiLCJjb250YWlucyIsImhhbmRsZUluZGljYXRvclNlbGVjdCIsImxvYWRSZW1haW5pbmdTbGlkZXMiLCJsb2FkQ29udHJvbHMiLCJzZXR1cFRyYW5zaXRpb25zIiwiYmluZEV2ZW50cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7Ozs7O0lBTU1BLE07QUFDSixrQkFBWUMsT0FBWixFQUFxQjtBQUFBOztBQUVuQjtBQUNBLFNBQUtDLE1BQUwsR0FBY0MsU0FBU0MsYUFBVCxDQUF1QkgsT0FBdkIsQ0FBZDtBQUNBLFNBQUtJLGVBQUwsR0FBdUIsS0FBS0gsTUFBTCxDQUFZRSxhQUFaLENBQTBCLFNBQTFCLENBQXZCO0FBQ0EsU0FBS0UsTUFBTCxHQUFjLEtBQUtKLE1BQUwsQ0FBWUssc0JBQVosQ0FBbUMsT0FBbkMsQ0FBZDs7QUFFQTtBQUNBLFNBQUtDLGlCQUFMLEdBQXlCLEtBQUtOLE1BQUwsQ0FBWUUsYUFBWixDQUEwQixzQkFBMUIsQ0FBekI7QUFDQSxTQUFLSyxpQkFBTCxHQUF5QixLQUFLUCxNQUFMLENBQVlFLGFBQVosQ0FBMEIsc0JBQTFCLENBQXpCO0FBQ0EsU0FBS00saUJBQUwsR0FBeUIsS0FBS1IsTUFBTCxDQUFZRSxhQUFaLENBQTBCLHNCQUExQixDQUF6QjtBQUNBLFNBQUtPLGtCQUFMLEdBQTBCLEtBQUtULE1BQUwsQ0FBWUUsYUFBWixDQUEwQix1QkFBMUIsQ0FBMUI7QUFDQSxTQUFLUSxnQkFBTCxHQUF3QixLQUFLVixNQUFMLENBQVlXLGdCQUFaLENBQTZCLG1CQUE3QixDQUF4QjtBQUNBLFNBQUtDLHlCQUFMLEdBQWlDLEtBQUtGLGdCQUFMLENBQXNCLENBQXRCLEVBQXlCRyxVQUExRDs7QUFFQTtBQUNBO0FBQ0EsU0FBS0MsV0FBTCxHQUFtQixDQUFDLENBQUMsS0FBS1IsaUJBQVAsSUFBNEIsQ0FBQyxDQUFDLEtBQUtDLGlCQUF0RDtBQUNBLFNBQUtR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dkI7QUFBMEMsbUJBQUtnRCxnQkFBTCxDQUFzQlIsQ0FBdEIsRUFBMEI7QUFDcEUsZUFBS0EsRUFBRU0sTUFBRixLQUFhLE9BQUs3QyxrQkFBdkI7QUFBMkMsbUJBQUtxRCxpQkFBTCxDQUF1QmQsQ0FBdkIsRUFBMkI7QUFDdEUsZUFBSyxPQUFLcEMseUJBQUwsQ0FBK0JtRCxRQUEvQixDQUF3Q2YsRUFBRU0sTUFBMUMsQ0FBTDtBQUF3RCxtQkFBS1UscUJBQUwsQ0FBMkJoQixDQUEzQixFQUErQjtBQUx6RjtBQU9ELE9BUkQ7O0FBVUE7QUFDQUMsYUFBT1csZ0JBQVAsQ0FBd0IsTUFBeEIsRUFBZ0MsWUFBTTtBQUNwQyxlQUFLSyxtQkFBTDtBQUNBLFlBQUksT0FBS2xELFdBQVQsRUFBc0IsT0FBS3lDLGdCQUFMO0FBQ3ZCLE9BSEQ7QUFJRDs7OzJCQUVNO0FBQ0wsV0FBS1UsWUFBTDtBQUNBLFdBQUtDLGdCQUFMO0FBQ0EsV0FBS0MsVUFBTDtBQUNEIiwiZmlsZSI6InNsaWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlcyBhbmQgaW5pdGlhbGlzZXMgYSBzbGlkZXIuIElmIHRoZSBzbGlkZXIgaXMgbm90XG4gKiBmdWxseSBpbml0aWFsaXNlZCwgdGhlIHBhZ2Ugc2hvdW9sZCBqdXN0IHJlbmRlciBhIHNpbmdsZSBzbGlkZSxcbiAqIHdpdGggbm8gY29udHJvbHMuXG4gKi9cblxuY2xhc3MgU2xpZGVyIHtcbiAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuXG4gICAgLy8gRE9NIHNlbGVjdGlvbjpcbiAgICB0aGlzLnNsaWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudCk7XG4gICAgdGhpcy5zbGlkZXNDb250YWluZXIgPSB0aGlzLnNsaWRlci5xdWVyeVNlbGVjdG9yKCcuc2xpZGVzJyk7XG4gICAgdGhpcy5zbGlkZXMgPSB0aGlzLnNsaWRlci5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzbGlkZScpO1xuXG4gICAgLy8gRE9NIGNvbnRyb2xzLCB1bmRlZmluZWQgdW50aWwgY29udHJvbHMgYXJlIGxvYWRlZCAodGhlc2UgbWF5IG5vdCBleGlzdCk6XG4gICAgdGhpcy5zbGlkZXJDb250cm9sUHJldiA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3IoJy5zbGlkZXItY29udHJvbC1wcmV2Jyk7XG4gICAgdGhpcy5zbGlkZXJDb250cm9sTmV4dCA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3IoJy5zbGlkZXItY29udHJvbC1uZXh0Jyk7XG4gICAgdGhpcy5zbGlkZXJDb250cm9sUGxheSA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3IoJy5zbGlkZXItY29udHJvbC1wbGF5Jyk7XG4gICAgdGhpcy5zbGlkZXJDb250cm9sUGF1c2UgPSB0aGlzLnNsaWRlci5xdWVyeVNlbGVjdG9yKCcuc2xpZGVyLWNvbnRyb2wtcGF1c2UnKTtcbiAgICB0aGlzLnNsaWRlckluZGljYXRvcnMgPSB0aGlzLnNsaWRlci5xdWVyeVNlbGVjdG9yQWxsKCcuc2xpZGVyLWluZGljYXRvcicpO1xuICAgIHRoaXMuc2xpZGVySW5kaWNhdG9yc0NvbnRhaW5lciA9IHRoaXMuc2xpZGVySW5kaWNhdG9yc1swXS5wYXJlbnROb2RlO1xuXG4gICAgLy8gRm9yIHRoZSBjb250cm9scyB0byB3b3JrLCBib3RoIHByZXYgYW5kIG5leHQgKm11c3QqIGJlIHByZXNlbnQuXG4gICAgLy8gZm9yIHRoZSBhdXRvcGxheSB0byB3b3JrLCBwYXVzZSBhbmQgcGxheSAqbXVzdCogYmUgcHJlc2VudC5cbiAgICB0aGlzLmhhc0NvbnRyb2xzID0gISF0aGlzLnNsaWRlckNvbnRyb2xQcmV2ICYmICEhdGhpcy5zbGlkZXJDb250cm9sTmV4dDtcbiAgICB0aGlzLmNhbkF1dG9wbGF5ID0gISF0aGlzLnNsaWRlckNvbnRyb2xQbGF5ICYmICEhdGhpcy5zbGlkZXJDb250cm9sUGF1c2U7XG4gICAgdGhpcy5oYXNJbmRpY2F0b3JzID0gdGhpcy5zbGlkZXJJbmRpY2F0b3JzLmxlbmd0aCA+IDA7XG4gICAgLy8gSW1tZWRpYXRlbHkgYmxvdyB1cCBpZiB0aGVyZSBhcmUgbm8gY29udHJvbHMgYXQgYWxsOlxuICAgIGlmICghdGhpcy5oYXNDb250cm9scyAmJiAhdGhpcy5jYW5BdXRvcGxheSAmJiAhdGhpcy5oYXNJbmRpY2F0b3JzKSB0aHJvdyBuZXcgRXJyb3IoJ1NsaWRlciBjb250cm9scyBjYW5ub3QgYmUgbG9jYXRlZCBpbiB0aGUgRE9NJyk7XG5cbiAgICAvLyBPdmVyd3JpdGUgdGhlIHNsaWRlciBkZWZhdWx0cyB3aXRoIGFueXRoaW5nIHBhc3NlZCBpbiBmcm9tIGRhdGEgYXR0cmlidXRlczpcbiAgICB0aGlzLm9wdHMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGludGVydmFsVGltZTogNDAwMCxcbiAgICAgIHRyYW5zaXRpb25EZWxheTogJzBzJyxcbiAgICAgIHRyYW5zaXRpb25EdXJhdGlvbjogJy43NXMnLFxuICAgICAgdHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uOiAnY3ViaWMtYmV6aWVyKDAuNTUwLCAwLjA1NSwgMC42NzUsIDAuMTkwKSdcbiAgICB9LCB0aGlzLnNsaWRlci5kYXRhc2V0KTtcblxuICAgIC8vIFNldCB1cCByZW1haW5pbmcgbmVjZXNzYXJ5IHN0YXRlOlxuICAgIHRoaXMuY3VycmVudFNsaWRlID0gMTsgLy8gVGhlIHNsaWRlcyBhcmUgMS1pbmRleGVkLCBhbmQgY3VycmVudCBzbGlkZSBhbHdheXMgc3RhcnRzIGF0IDFcbiAgICB0aGlzLm51bVNsaWRlcyA9IHRoaXMuc2xpZGVzLmxlbmd0aDtcbiAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlOyAvLyB1c2UgdG8gY2hlY2sgaWYgYXV0b3BsYXkgdGltZXIgc2hvdWxkIGJlIHJlc2V0IHdoZW4gbmV4dC9wcmV2IHNsaWRlIGlzIGNsaWNrZWRcbiAgICB0aGlzLmludGVydmFsOyAvLyBpbml0aWFsbHkgdW5kZWZpbmVkLCByZWZlcmVuY2UgdXNlZCB0byB0aGUgYXV0b3BsYXkgaW50ZXJ2YWxcbiAgfVxuXG4gIGxvYWRSZW1haW5pbmdTbGlkZXMoKSB7XG4gICAgWy4uLnRoaXMuc2xpZGVzQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZ1tkYXRhLXNyY10nKV0uZm9yRWFjaChpbWcgPT4ge1xuICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgaW1nLmRhdGFzZXQuc3JjKTtcbiAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiBpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNyYycpO1xuICAgIH0pO1xuICB9XG5cbiAgbG9hZENvbnRyb2xzKCkge1xuICAgIC8vIElmIHRoZXJlIGlzIG9ubHkgb25lIHNsaWRlIChvciBub25lKSwgbm8gY29udHJvbHMgbmVlZCBiZSByZW5kZXJlZDpcbiAgICBpZiAodGhpcy5udW1TbGlkZXMgPCAyKSB7XG4gICAgICBpZiAodGhpcy5oYXNDb250cm9scykge1xuICAgICAgICBbdGhpcy5zbGlkZXJDb250cm9sUHJldiwgdGhpcy5zbGlkZXJDb250cm9sTmV4dF0uZm9yRWFjaChjdHJsID0+IGN0cmwuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJykpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuY2FuQXV0b3BsYXkpIHtcbiAgICAgICAgW3RoaXMuc2xpZGVyQ29udHJvbFBsYXksIHRoaXMuc2xpZGVyQ29udHJvbFBhdXNlXS5mb3JFYWNoKGN0cmwgPT4gY3RybC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKSk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5oYXNJbmRpY2F0b3JzKSAge1xuICAgICAgICB0aGlzLnNsaWRlckluZGljYXRvcnNDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICBzZXR1cFRyYW5zaXRpb25zKCkge1xuICAgIC8vIFRoZSBzbGlkaW5nIHRyYW5zaXRpb24gaXMgaW5oZXJlbnRseSB0aWVkIHRvIHRoZSBzbGlkZXIgVUksXG4gICAgLy8g4oi1IGl0IGRlcGVuZHMgdXBvbiBrbm93aW5nIG51bWJlciBvZiBzbGlkZXM7IOKItCByZW5kZXJlZCBpbmxpbmVcbiAgICBPYmplY3QuYXNzaWduKHRoaXMuc2xpZGVzQ29udGFpbmVyLnN0eWxlLCB7XG4gICAgICB3aWR0aDogYCR7dGhpcy5udW1TbGlkZXMgKiAxMDB9JWAsXG4gICAgICB0cmFuc2l0aW9uRGVsYXk6IHRoaXMub3B0cy50cmFuc2l0aW9uRGVsYXksXG4gICAgICB0cmFuc2l0aW9uRHVyYXRpb246IHRoaXMub3B0cy50cmFuc2l0aW9uRHVyYXRpb24sXG4gICAgICB0cmFuc2l0aW9uUHJvcGVydHk6ICd0cmFuc2Zvcm0nLFxuICAgICAgdHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uOiB0aGlzLm9wdHMudHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uLFxuICAgIH0pO1xuXG4gICAgdGhpcy5hcHBseVRyYW5zbGF0aW9uKCk7XG4gIH1cblxuICBhcHBseVRyYW5zbGF0aW9uKCkge1xuICAgIGNvbnN0IHRyYW5zbGF0aW9uID0gYHRyYW5zbGF0ZVgoLSR7KHRoaXMuY3VycmVudFNsaWRlIC0gMSkgKiAoMTAwIC8gdGhpcy5udW1TbGlkZXMpfSUpYDtcbiAgICB0aGlzLnNsaWRlc0NvbnRhaW5lci5zdHlsZS50cmFuc2Zvcm0gPSB0cmFuc2xhdGlvbjtcbiAgfVxuXG4gIHNldEluZGljYXRvcigpIHtcbiAgICBbLi4udGhpcy5zbGlkZXJJbmRpY2F0b3JzXS5mb3JFYWNoKChpbmRpY2F0b3IsIGkpID0+IHtcbiAgICAgIGluZGljYXRvci5zZXRBdHRyaWJ1dGUoJ2FyaWEtc2VsZWN0ZWQnLCAoaSArIDEgPT09IHRoaXMuY3VycmVudFNsaWRlKSA/ICd0cnVlJyA6ICdmYWxzZScpO1xuICAgIH0pO1xuICB9XG5cblxuICBzaG93Q3VycmVudCgpIHtcbiAgICAvLyBTd2l0Y2ggYXJpYS1oaWRkZW4gb24gYW5kIG9mZiBmb3IgYWNjZXNzaWJpbGl0eSByZWFzb25zIC0gdGhlXG4gICAgLy8gbm9uLXZpc2libGUgc2xpZGVzIHNob3VsZCBiZSBoaWRkZW4gZnJvbSBhY2Nlc3NpYmlsaXR5IHRvb2xzLlxuICAgIFsuLi50aGlzLnNsaWRlc10uZm9yRWFjaCgoc2xpZGUsIGkpID0+IHtcbiAgICAgIC8vIE5PVEUgU2xpZGVzIGFyZSAxLWluZGV4ZWQsIHNvIHdoZW4gbG9vcGluZyB0aHJvdWdoIHRoZVxuICAgICAgLy8gc2xpZGVzLCBuZWVkIHRvIGNvbXBhcmUgYWdhaW5zdCBpICsgMS5cbiAgICAgIHNsaWRlLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAoaSArIDEgPT09IHRoaXMuY3VycmVudFNsaWRlKSA/ICdmYWxzZScgOiAndHJ1ZScpO1xuICAgIH0pO1xuICAgIHRoaXMuc2V0SW5kaWNhdG9yKCk7XG4gICAgdGhpcy5hcHBseVRyYW5zbGF0aW9uKCk7XG4gIH1cblxuICBoYW5kbGVJbmRpY2F0b3JTZWxlY3QoZSkge1xuICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgIGNvbnN0IHNlbGVjdGVkU2xpZGVJbmRleCA9IFsuLi50aGlzLnNsaWRlckluZGljYXRvcnNDb250YWluZXIuY2hpbGRyZW5dLmluZGV4T2YoZS50YXJnZXQpO1xuICAgIHRoaXMuY3VycmVudFNsaWRlID0gc2VsZWN0ZWRTbGlkZUluZGV4ICsgMTtcbiAgICB0aGlzLnNob3dDdXJyZW50KCk7XG4gICAgaWYgKHRoaXMuY2FuQXV0b3BsYXkgJiYgdGhpcy5pc1BsYXlpbmcpIHRoaXMuaGFuZGxlUGxheVNsaWRlcygpO1xuICB9XG5cbiAgaGFuZGxlTmV4dFNsaWRlKGUpIHtcbiAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcbiAgICB0aGlzLmN1cnJlbnRTbGlkZSA9ICh0aGlzLmN1cnJlbnRTbGlkZSArIDEgPiB0aGlzLm51bVNsaWRlcykgPyAxIDogdGhpcy5jdXJyZW50U2xpZGUgKyAxO1xuICAgIHRoaXMuc2hvd0N1cnJlbnQoKTtcbiAgICBpZiAodGhpcy5jYW5BdXRvcGxheSAmJiB0aGlzLmlzUGxheWluZykgdGhpcy5oYW5kbGVQbGF5U2xpZGVzKCk7XG4gIH1cblxuICBoYW5kbGVQcmV2U2xpZGUoZSkge1xuICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgIHRoaXMuY3VycmVudFNsaWRlID0gKHRoaXMuY3VycmVudFNsaWRlIC0gMSA9PT0gMCkgPyB0aGlzLm51bVNsaWRlcyA6IHRoaXMuY3VycmVudFNsaWRlIC0gMTtcbiAgICB0aGlzLnNob3dDdXJyZW50KCk7XG4gICAgaWYgKHRoaXMuY2FuQXV0b3BsYXkgJiYgdGhpcy5pc1BsYXlpbmcpIHRoaXMuaGFuZGxlUGxheVNsaWRlcygpO1xuICB9XG5cbiAgaGFuZGxlUGxheVNsaWRlcyhlKSB7XG4gICAgdGhpcy5zbGlkZXJDb250cm9sUGxheS5kaXNhYmxlZCA9IHRydWU7XG4gICAgdGhpcy5pc1BsYXlpbmcgPSB0cnVlO1xuICAgIHRoaXMuaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmhhbmRsZU5leHRTbGlkZSgpLCB0aGlzLm9wdHMuaW50ZXJ2YWxUaW1lKTtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQYXVzZS5kaXNhYmxlZCA9IGZhbHNlO1xuICB9XG5cbiAgaGFuZGxlUGF1c2VTbGlkZXMoZSkge1xuICAgIHRoaXMuc2xpZGVyQ29udHJvbFBhdXNlLmRpc2FibGVkID0gdHJ1ZTtcbiAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgIHRoaXMuaW50ZXJ2YWwgPSB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQbGF5LmRpc2FibGVkID0gZmFsc2U7XG4gIH1cblxuICBiaW5kRXZlbnRzKCkge1xuICAgIHRoaXMuc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICAgICAgY2FzZSBlLnRhcmdldCA9PT0gdGhpcy5zbGlkZXJDb250cm9sUHJldjogdGhpcy5oYW5kbGVQcmV2U2xpZGUoZSk7IGJyZWFrO1xuICAgICAgICBjYXNlIGUudGFyZ2V0ID09PSB0aGlzLnNsaWRlckNvbnRyb2xOZXh0OiB0aGlzLmhhbmRsZU5leHRTbGlkZShlKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgZS50YXJnZXQgPT09IHRoaXMuc2xpZGVyQ29udHJvbFBsYXk6IHRoaXMuaGFuZGxlUGxheVNsaWRlcyhlKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgZS50YXJnZXQgPT09IHRoaXMuc2xpZGVyQ29udHJvbFBhdXNlOiB0aGlzLmhhbmRsZVBhdXNlU2xpZGVzKGUpOyBicmVhaztcbiAgICAgICAgY2FzZSB0aGlzLnNsaWRlckluZGljYXRvcnNDb250YWluZXIuY29udGFpbnMoZS50YXJnZXQpOiB0aGlzLmhhbmRsZUluZGljYXRvclNlbGVjdChlKTsgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBTZXQgdXAgdGhlIGF1dG9wbGF5IGFmdGVyIGV2ZXJ5dGhpbmcsIGluY2x1ZGluZyBpbWFnZXMsIGhhcyBsb2FkZWQ6XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCAoKSA9PiB7XG4gICAgICB0aGlzLmxvYWRSZW1haW5pbmdTbGlkZXMoKTtcbiAgICAgIGlmICh0aGlzLmNhbkF1dG9wbGF5KSB0aGlzLmhhbmRsZVBsYXlTbGlkZXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgdGhpcy5sb2FkQ29udHJvbHMoKTtcbiAgICB0aGlzLnNldHVwVHJhbnNpdGlvbnMoKTtcbiAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgfVxufVxuIl19