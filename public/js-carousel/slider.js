'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

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

    var sliderDefaults = {
      intervalTime: 4000,
      transitionDelay: '0s',
      transitionDuration: '.75s',
      transitionTimingFunction: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)'
    };

    // DOM selection:
    this.slider = document.querySelector(element);
    this.slidesContainer = this.slider.querySelector('.slides');
    this.slides = this.slider.getElementsByClassName('slide');

    // DOM controls, undefined until controls are loaded (these may not exist):
    this.sliderControlPrev = this.slider.querySelector('.slider-control-prev');
    this.sliderControlNext = this.slider.querySelector('.slider-control-next');
    this.sliderControlPlay = this.slider.querySelector('.slider-control-play');
    this.sliderControlPause = this.slider.querySelector('.slider-control-pause');

    // For the controls to work, both prev and next *must* be present.
    // for the autoplay to work, pause and play *must* be present.
    this.hasControls = !!this.sliderControlPrev && !!this.sliderControlNext;
    this.canAutoplay = !!this.sliderControlPlay && !!this.sliderControlPause;
    // Immediately blow up if there are no controls at all:
    if (!this.hasControls && !this.canAutoplay) throw new Error('Slider controls cannot be located in the DOM');

    // Overwrite the slider defaults with anything passed in from data attributes:
    this.opts = _extends({}, this.slider.dataset, sliderDefaults);

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
      }
    }
  }, {
    key: 'setupTransitions',
    value: function setupTransitions() {
      // The sliding transition is inherently tied to the slider UI,
      // ∵ it depends upon knowing number of slides; ∴ rendered inline
      _extends(this.slidesContainer.style, {
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
    key: 'showCurrent',
    value: function showCurrent() {
      var _this = this;

      // Switch aria-hidden on and off for accessibility reasons - the
      // non-visible slides should be hidden from accessibility tools.
      [].concat(_toConsumableArray(this.slides)).forEach(function (slide, i) {
        // NOTE Slides are 1-indexed, so when looping through the
        // slides, need to compare against i + 1.
        slide.setAttribute('aria-hidden', i + 1 === _this.currentSlide ? 'false' : 'true');
      });

      this.applyTranslation();
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
      var _this2 = this;

      this.sliderControlPlay.disabled = true;
      this.isPlaying = true;
      this.interval = setInterval(function () {
        return _this2.handleNextSlide();
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
      var _this3 = this;

      this.slider.addEventListener('click', function (e) {
        switch (true) {
          case e.target === _this3.sliderControlPrev:
            _this3.handlePrevSlide(e);break;
          case e.target === _this3.sliderControlNext:
            _this3.handleNextSlide(e);break;
          case e.target === _this3.sliderControlPlay:
            _this3.handlePlaySlides(e);break;
          case e.target === _this3.sliderControlPause:
            _this3.handlePauseSlides(e);break;
        }
      });

      // Set up the autoplay after everything, including images, has loaded:
      window.addEventListener('load', function () {
        _this3.loadRemainingSlides();
        if (_this3.canAutoplay) _this3.handlePlaySlides();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qcy1jYXJvdXNlbC9zbGlkZXIuanMiXSwibmFtZXMiOlsiU2xpZGVyIiwiZWxlbWVudCIsInNsaWRlckRlZmF1bHRzIiwiaW50ZXJ2YWxUaW1lIiwidHJhbnNpdGlvbkRlbGF5IiwidHJhbnNpdGlvbkR1cmF0aW9uIiwidHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uIiwic2xpZGVyIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yIiwic2xpZGVzQ29udGFpbmVyIiwic2xpZGVzIiwiZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSIsInNsaWRlckNvbnRyb2xQcmV2Iiwic2xpZGVyQ29udHJvbE5leHQiLCJzbGlkZXJDb250cm9sUGxheSIsInNsaWRlckNvbnRyb2xQYXVzZSIsImhhc0NvbnRyb2xzIiwiY2FuQXV0b3BsYXkiLCJFcnJvciIsIm9wdHMiLCJkYXRhc2V0IiwiY3VycmVudFNsaWRlIiwibnVtU2xpZGVzIiwibGVuZ3RoIiwiaXNQbGF5aW5nIiwiaW50ZXJ2YWwiLCJxdWVyeVNlbGVjdG9yQWxsIiwiZm9yRWFjaCIsImltZyIsInNldEF0dHJpYnV0ZSIsInNyYyIsIm9ubG9hZCIsInJlbW92ZUF0dHJpYnV0ZSIsImN0cmwiLCJzdHlsZSIsIndpZHRoIiwidHJhbnNpdGlvblByb3BlcnR5IiwiYXBwbHlUcmFuc2xhdGlvbiIsInRyYW5zbGF0aW9uIiwidHJhbnNmb3JtIiwic2xpZGUiLCJpIiwiZSIsIndpbmRvdyIsImNsZWFySW50ZXJ2YWwiLCJzaG93Q3VycmVudCIsImhhbmRsZVBsYXlTbGlkZXMiLCJkaXNhYmxlZCIsInNldEludGVydmFsIiwiaGFuZGxlTmV4dFNsaWRlIiwiYWRkRXZlbnRMaXN0ZW5lciIsInRhcmdldCIsImhhbmRsZVByZXZTbGlkZSIsImhhbmRsZVBhdXNlU2xpZGVzIiwibG9hZFJlbWFpbmluZ1NsaWRlcyIsImxvYWRDb250cm9scyIsInNldHVwVHJhbnNpdGlvbnMiLCJiaW5kRXZlbnRzIl0sIm1hcHBpbmdz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SixDQUF0QixFQUEwQjtBQUNwRSxlQUFLQSxFQUFFUyxNQUFGLEtBQWEsT0FBS3BDLGtCQUF2QjtBQUEyQyxtQkFBS3NDLGlCQUFMLENBQXVCWCxDQUF2QixFQUEyQjtBQUp4RTtBQU1ELE9BUEQ7O0FBU0E7QUFDQUMsYUFBT08sZ0JBQVAsQ0FBd0IsTUFBeEIsRUFBZ0MsWUFBTTtBQUNwQyxlQUFLSSxtQkFBTDtBQUNBLFlBQUksT0FBS3JDLFdBQVQsRUFBc0IsT0FBSzZCLGdCQUFMO0FBQ3ZCLE9BSEQ7QUFJRDs7OzJCQUVNO0FBQ0wsV0FBS1MsWUFBTDtBQUNBLFdBQUtDLGdCQUFMO0FBQ0EsV0FBS0MsVUFBTDtBQUNEIiwiZmlsZSI6InNsaWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlcyBhbmQgaW5pdGlhbGlzZXMgYSBzbGlkZXIuIElmIHRoZSBzbGlkZXIgaXMgbm90XG4gKiBmdWxseSBpbml0aWFsaXNlZCwgdGhlIHBhZ2Ugc2hvdW9sZCBqdXN0IHJlbmRlciBhIHNpbmdsZSBzbGlkZSxcbiAqIHdpdGggbm8gY29udHJvbHMuXG4gKi9cblxuY2xhc3MgU2xpZGVyIHtcbiAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuICAgIGNvbnN0IHNsaWRlckRlZmF1bHRzID0ge1xuICAgICAgaW50ZXJ2YWxUaW1lOiA0MDAwLFxuICAgICAgdHJhbnNpdGlvbkRlbGF5OiAnMHMnLFxuICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uOiAnLjc1cycsXG4gICAgICB0cmFuc2l0aW9uVGltaW5nRnVuY3Rpb246ICdjdWJpYy1iZXppZXIoMC41NTAsIDAuMDU1LCAwLjY3NSwgMC4xOTApJ1xuICAgIH07XG5cbiAgICAvLyBET00gc2VsZWN0aW9uOlxuICAgIHRoaXMuc2xpZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtZW50KTtcbiAgICB0aGlzLnNsaWRlc0NvbnRhaW5lciA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3IoJy5zbGlkZXMnKTtcbiAgICB0aGlzLnNsaWRlcyA9IHRoaXMuc2xpZGVyLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3NsaWRlJyk7XG5cbiAgICAvLyBET00gY29udHJvbHMsIHVuZGVmaW5lZCB1bnRpbCBjb250cm9scyBhcmUgbG9hZGVkICh0aGVzZSBtYXkgbm90IGV4aXN0KTpcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQcmV2ID0gdGhpcy5zbGlkZXIucXVlcnlTZWxlY3RvcignLnNsaWRlci1jb250cm9sLXByZXYnKTtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xOZXh0ID0gdGhpcy5zbGlkZXIucXVlcnlTZWxlY3RvcignLnNsaWRlci1jb250cm9sLW5leHQnKTtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQbGF5ID0gdGhpcy5zbGlkZXIucXVlcnlTZWxlY3RvcignLnNsaWRlci1jb250cm9sLXBsYXknKTtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQYXVzZSA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3IoJy5zbGlkZXItY29udHJvbC1wYXVzZScpO1xuXG4gICAgLy8gRm9yIHRoZSBjb250cm9scyB0byB3b3JrLCBib3RoIHByZXYgYW5kIG5leHQgKm11c3QqIGJlIHByZXNlbnQuXG4gICAgLy8gZm9yIHRoZSBhdXRvcGxheSB0byB3b3JrLCBwYXVzZSBhbmQgcGxheSAqbXVzdCogYmUgcHJlc2VudC5cbiAgICB0aGlzLmhhc0NvbnRyb2xzID0gISF0aGlzLnNsaWRlckNvbnRyb2xQcmV2ICYmICEhdGhpcy5zbGlkZXJDb250cm9sTmV4dDtcbiAgICB0aGlzLmNhbkF1dG9wbGF5ID0gISF0aGlzLnNsaWRlckNvbnRyb2xQbGF5ICYmICEhdGhpcy5zbGlkZXJDb250cm9sUGF1c2U7XG4gICAgLy8gSW1tZWRpYXRlbHkgYmxvdyB1cCBpZiB0aGVyZSBhcmUgbm8gY29udHJvbHMgYXQgYWxsOlxuICAgIGlmICghdGhpcy5oYXNDb250cm9scyAmJiAhdGhpcy5jYW5BdXRvcGxheSkgdGhyb3cgbmV3IEVycm9yKCdTbGlkZXIgY29udHJvbHMgY2Fubm90IGJlIGxvY2F0ZWQgaW4gdGhlIERPTScpO1xuXG4gICAgLy8gT3ZlcndyaXRlIHRoZSBzbGlkZXIgZGVmYXVsdHMgd2l0aCBhbnl0aGluZyBwYXNzZWQgaW4gZnJvbSBkYXRhIGF0dHJpYnV0ZXM6XG4gICAgdGhpcy5vcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5zbGlkZXIuZGF0YXNldCwgc2xpZGVyRGVmYXVsdHMpO1xuXG4gICAgLy8gU2V0IHVwIHJlbWFpbmluZyBuZWNlc3Nhcnkgc3RhdGU6XG4gICAgdGhpcy5jdXJyZW50U2xpZGUgPSAxOyAvLyBUaGUgc2xpZGVzIGFyZSAxLWluZGV4ZWQsIGFuZCBjdXJyZW50IHNsaWRlIGFsd2F5cyBzdGFydHMgYXQgMVxuICAgIHRoaXMubnVtU2xpZGVzID0gdGhpcy5zbGlkZXMubGVuZ3RoO1xuICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7IC8vIHVzZSB0byBjaGVjayBpZiBhdXRvcGxheSB0aW1lciBzaG91bGQgYmUgcmVzZXQgd2hlbiBuZXh0L3ByZXYgc2xpZGUgaXMgY2xpY2tlZFxuICAgIHRoaXMuaW50ZXJ2YWw7IC8vIGluaXRpYWxseSB1bmRlZmluZWQsIHJlZmVyZW5jZSB1c2VkIHRvIHRoZSBhdXRvcGxheSBpbnRlcnZhbFxuICB9XG5cbiAgbG9hZFJlbWFpbmluZ1NsaWRlcygpIHtcbiAgICBbLi4udGhpcy5zbGlkZXNDb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnaW1nW2RhdGEtc3JjXScpXS5mb3JFYWNoKGltZyA9PiB7XG4gICAgICBpbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBpbWcuZGF0YXNldC5zcmMpO1xuICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IGltZy5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtc3JjJyk7XG4gICAgfSk7XG4gIH1cblxuICBsb2FkQ29udHJvbHMoKSB7XG4gICAgLy8gSWYgdGhlcmUgaXMgb25seSBvbmUgc2xpZGUgKG9yIG5vbmUpLCBubyBjb250cm9scyBuZWVkIGJlIHJlbmRlcmVkOlxuICAgIGlmICh0aGlzLm51bVNsaWRlcyA8IDIpIHtcbiAgICAgIGlmICh0aGlzLmhhc0NvbnRyb2xzKSB7XG4gICAgICAgIFt0aGlzLnNsaWRlckNvbnRyb2xQcmV2LCB0aGlzLnNsaWRlckNvbnRyb2xOZXh0XS5mb3JFYWNoKGN0cmwgPT4gY3RybC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKSk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5jYW5BdXRvcGxheSkge1xuICAgICAgICBbdGhpcy5zbGlkZXJDb250cm9sUGxheSwgdGhpcy5zbGlkZXJDb250cm9sUGF1c2VdLmZvckVhY2goY3RybCA9PiBjdHJsLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIHNldHVwVHJhbnNpdGlvbnMoKSB7XG4gICAgLy8gVGhlIHNsaWRpbmcgdHJhbnNpdGlvbiBpcyBpbmhlcmVudGx5IHRpZWQgdG8gdGhlIHNsaWRlciBVSSxcbiAgICAvLyDiiLUgaXQgZGVwZW5kcyB1cG9uIGtub3dpbmcgbnVtYmVyIG9mIHNsaWRlczsg4oi0IHJlbmRlcmVkIGlubGluZVxuICAgIE9iamVjdC5hc3NpZ24odGhpcy5zbGlkZXNDb250YWluZXIuc3R5bGUsIHtcbiAgICAgIHdpZHRoOiBgJHt0aGlzLm51bVNsaWRlcyAqIDEwMH0lYCxcbiAgICAgIHRyYW5zaXRpb25EZWxheTogdGhpcy5vcHRzLnRyYW5zaXRpb25EZWxheSxcbiAgICAgIHRyYW5zaXRpb25EdXJhdGlvbjogdGhpcy5vcHRzLnRyYW5zaXRpb25EdXJhdGlvbixcbiAgICAgIHRyYW5zaXRpb25Qcm9wZXJ0eTogJ3RyYW5zZm9ybScsXG4gICAgICB0cmFuc2l0aW9uVGltaW5nRnVuY3Rpb246IHRoaXMub3B0cy50cmFuc2l0aW9uVGltaW5nRnVuY3Rpb24sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFwcGx5VHJhbnNsYXRpb24oKTtcbiAgfVxuXG4gIGFwcGx5VHJhbnNsYXRpb24oKSB7XG4gICAgY29uc3QgdHJhbnNsYXRpb24gPSBgdHJhbnNsYXRlWCgtJHsodGhpcy5jdXJyZW50U2xpZGUgLSAxKSAqICgxMDAgLyB0aGlzLm51bVNsaWRlcyl9JSlgO1xuICAgIHRoaXMuc2xpZGVzQ29udGFpbmVyLnN0eWxlLnRyYW5zZm9ybSA9IHRyYW5zbGF0aW9uO1xuICB9XG5cblxuICBzaG93Q3VycmVudCgpIHtcbiAgICAvLyBTd2l0Y2ggYXJpYS1oaWRkZW4gb24gYW5kIG9mZiBmb3IgYWNjZXNzaWJpbGl0eSByZWFzb25zIC0gdGhlXG4gICAgLy8gbm9uLXZpc2libGUgc2xpZGVzIHNob3VsZCBiZSBoaWRkZW4gZnJvbSBhY2Nlc3NpYmlsaXR5IHRvb2xzLlxuICAgIFsuLi50aGlzLnNsaWRlc10uZm9yRWFjaCgoc2xpZGUsIGkpID0+IHtcbiAgICAgIC8vIE5PVEUgU2xpZGVzIGFyZSAxLWluZGV4ZWQsIHNvIHdoZW4gbG9vcGluZyB0aHJvdWdoIHRoZVxuICAgICAgLy8gc2xpZGVzLCBuZWVkIHRvIGNvbXBhcmUgYWdhaW5zdCBpICsgMS5cbiAgICAgIHNsaWRlLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAoaSArIDEgPT09IHRoaXMuY3VycmVudFNsaWRlKSA/ICdmYWxzZScgOiAndHJ1ZScpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5hcHBseVRyYW5zbGF0aW9uKCk7XG4gIH1cblxuICBoYW5kbGVOZXh0U2xpZGUoZSkge1xuICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgIHRoaXMuY3VycmVudFNsaWRlID0gKHRoaXMuY3VycmVudFNsaWRlICsgMSA+IHRoaXMubnVtU2xpZGVzKSA/IDEgOiB0aGlzLmN1cnJlbnRTbGlkZSArIDE7XG4gICAgdGhpcy5zaG93Q3VycmVudCgpO1xuICAgIGlmICh0aGlzLmNhbkF1dG9wbGF5ICYmIHRoaXMuaXNQbGF5aW5nKSB0aGlzLmhhbmRsZVBsYXlTbGlkZXMoKTtcbiAgfVxuXG4gIGhhbmRsZVByZXZTbGlkZShlKSB7XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG4gICAgdGhpcy5jdXJyZW50U2xpZGUgPSAodGhpcy5jdXJyZW50U2xpZGUgLSAxID09PSAwKSA/IHRoaXMubnVtU2xpZGVzIDogdGhpcy5jdXJyZW50U2xpZGUgLSAxO1xuICAgIHRoaXMuc2hvd0N1cnJlbnQoKTtcbiAgICBpZiAodGhpcy5jYW5BdXRvcGxheSAmJiB0aGlzLmlzUGxheWluZykgdGhpcy5oYW5kbGVQbGF5U2xpZGVzKCk7XG4gIH1cblxuICBoYW5kbGVQbGF5U2xpZGVzKGUpIHtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQbGF5LmRpc2FibGVkID0gdHJ1ZTtcbiAgICB0aGlzLmlzUGxheWluZyA9IHRydWU7XG4gICAgdGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHRoaXMuaGFuZGxlTmV4dFNsaWRlKCksIHRoaXMub3B0cy5pbnRlcnZhbFRpbWUpO1xuICAgIHRoaXMuc2xpZGVyQ29udHJvbFBhdXNlLmRpc2FibGVkID0gZmFsc2U7XG4gIH1cblxuICBoYW5kbGVQYXVzZVNsaWRlcyhlKSB7XG4gICAgdGhpcy5zbGlkZXJDb250cm9sUGF1c2UuZGlzYWJsZWQgPSB0cnVlO1xuICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XG4gICAgdGhpcy5pbnRlcnZhbCA9IHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgIHRoaXMuc2xpZGVyQ29udHJvbFBsYXkuZGlzYWJsZWQgPSBmYWxzZTtcbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG4gICAgdGhpcy5zbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgICBjYXNlIGUudGFyZ2V0ID09PSB0aGlzLnNsaWRlckNvbnRyb2xQcmV2OiB0aGlzLmhhbmRsZVByZXZTbGlkZShlKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgZS50YXJnZXQgPT09IHRoaXMuc2xpZGVyQ29udHJvbE5leHQ6IHRoaXMuaGFuZGxlTmV4dFNsaWRlKGUpOyBicmVhaztcbiAgICAgICAgY2FzZSBlLnRhcmdldCA9PT0gdGhpcy5zbGlkZXJDb250cm9sUGxheTogdGhpcy5oYW5kbGVQbGF5U2xpZGVzKGUpOyBicmVhaztcbiAgICAgICAgY2FzZSBlLnRhcmdldCA9PT0gdGhpcy5zbGlkZXJDb250cm9sUGF1c2U6IHRoaXMuaGFuZGxlUGF1c2VTbGlkZXMoZSk7IGJyZWFrO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gU2V0IHVwIHRoZSBhdXRvcGxheSBhZnRlciBldmVyeXRoaW5nLCBpbmNsdWRpbmcgaW1hZ2VzLCBoYXMgbG9hZGVkOlxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xuICAgICAgdGhpcy5sb2FkUmVtYWluaW5nU2xpZGVzKCk7XG4gICAgICBpZiAodGhpcy5jYW5BdXRvcGxheSkgdGhpcy5oYW5kbGVQbGF5U2xpZGVzKCk7XG4gICAgfSk7XG4gIH1cblxuICBpbml0KCkge1xuICAgIHRoaXMubG9hZENvbnRyb2xzKCk7XG4gICAgdGhpcy5zZXR1cFRyYW5zaXRpb25zKCk7XG4gICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gIH1cbn1cbiJdfQ==