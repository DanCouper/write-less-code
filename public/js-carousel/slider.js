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
    this.opts = Object.assign({}, this.slider.dataset, sliderDefaults);

    // Set up remaining necessary state:
    this.currentSlide = 1; // The slides are 1-indexed, and current slide always starts at 1
    this.numSlides = this.slides.length;
    this.isPlaying = false; // use to check if autoplay timer should be reset when next/prev slide is clicked
    this.interval; // initially undefined, reference used to the autoplay interval
  }

  _createClass(Slider, [{
    key: 'loadRemainingSlides',
    value: function loadRemainingSlides() {
      this.slidesContainer.querySelectorAll('img[data-src]').forEach(function (img) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qcy1jYXJvdXNlbC9zbGlkZXIuanMiXSwibmFtZXMiOlsiU2xpZGVyIiwiZWxlbWVudCIsInNsaWRlckRlZmF1bHRzIiwiaW50ZXJ2YWxUaW1lIiwidHJhbnNpdGlvbkRlbGF5IiwidHJhbnNpdGlvbkR1cmF0aW9uIiwidHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uIiwic2xpZGVyIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yIiwic2xpZGVzQ29udGFpbmVyIiwic2xpZGVzIiwiZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSIsInNsaWRlckNvbnRyb2xQcmV2Iiwic2xpZGVyQ29udHJvbE5leHQiLCJzbGlkZXJDb250cm9sUGxheSIsInNsaWRlckNvbnRyb2xQYXVzZSIsImhhc0NvbnRyb2xzIiwiY2FuQXV0b3BsYXkiLCJFcnJvciIsIm9wdHMiLCJPYmplY3QiLCJhc3NpZ24iLCJkYXRhc2V0IiwiY3VycmVudFNsaWRlIiwibnVtU2xpZGVzIiwibGVuZ3RoIiwiaXNQbGF5aW5nIiwiaW50ZXJ2YWwiLCJxdWVyeVNlbGVjdG9yQWxsIiwiZm9yRWFjaCIsImltZyIsInNldEF0dHJpYnV0ZSIsInNyYyIsIm9ubG9hZCIsInJlbW92ZUF0dHJpYnV0ZSIsImN0cmwiLCJzdHlsZSIsIndpZHRoIiwidHJhbnNpdGlvblByb3BlcnR5IiwiYXBwbHlUcmFuc2xhdGlvbiIsInRyYW5zbGF0aW9uIiwidHJhbnNmb3JtIiwic2xpZGUiLCJpIiwiZSIsIndpbmRvdyIsImNsZWFySW50ZXJ2YWwiLCJzaG93Q3VycmVudCIsImhhbmRsZVBsYXlTbGlkZXMiLCJkaXNhYmxlZCIsInNldEludGVydmFsIiwiaGFuZGxlTmV4dFNsaWRlIiwiYWRkRXZlbnRMaXN0ZW5lciIsInRhcmdldCIsImhhbmRsZVByZXZTbGlkZSIsImhhbmRsZVBhdXNlU2xpZGVzIiwibG9hZFJlbWFpbmluZ1NsaWRlcyIsImxvYWRDb250cm9scyIsInNldHVwVHJhbnNpdGlvbnMiLCJiaW5k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QUF2QjtBQUEwQyxtQkFBS2tDLGdCQUFMLENBQXNCSixDQUF0QixFQUEwQjtBQUNwRSxlQUFLQSxFQUFFUyxNQUFGLEtBQWEsT0FBS3RDLGtCQUF2QjtBQUEyQyxtQkFBS3dDLGlCQUFMLENBQXVCWCxDQUF2QixFQUEyQjtBQUp4RTtBQU1ELE9BUEQ7O0FBU0E7QUFDQUMsYUFBT08sZ0JBQVAsQ0FBd0IsTUFBeEIsRUFBZ0MsWUFBTTtBQUNwQyxlQUFLSSxtQkFBTDtBQUNBLFlBQUksT0FBS3ZDLFdBQVQsRUFBc0IsT0FBSytCLGdCQUFMO0FBQ3ZCLE9BSEQ7QUFJRDs7OzJCQUVNO0FBQ0wsV0FBS1MsWUFBTDtBQUNBLFdBQUtDLGdCQUFMO0FBQ0EsV0FBS0MsVUFBTDtBQUNEIiwiZmlsZSI6InNsaWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlcyBhbmQgaW5pdGlhbGlzZXMgYSBzbGlkZXIuIElmIHRoZSBzbGlkZXIgaXMgbm90XG4gKiBmdWxseSBpbml0aWFsaXNlZCwgdGhlIHBhZ2Ugc2hvdW9sZCBqdXN0IHJlbmRlciBhIHNpbmdsZSBzbGlkZSxcbiAqIHdpdGggbm8gY29udHJvbHMuXG4gKi9cblxuY2xhc3MgU2xpZGVyIHtcbiAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuICAgIGNvbnN0IHNsaWRlckRlZmF1bHRzID0ge1xuICAgICAgaW50ZXJ2YWxUaW1lOiA0MDAwLFxuICAgICAgdHJhbnNpdGlvbkRlbGF5OiAnMHMnLFxuICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uOiAnLjc1cycsXG4gICAgICB0cmFuc2l0aW9uVGltaW5nRnVuY3Rpb246ICdjdWJpYy1iZXppZXIoMC41NTAsIDAuMDU1LCAwLjY3NSwgMC4xOTApJ1xuICAgIH07XG5cbiAgICAvLyBET00gc2VsZWN0aW9uOlxuICAgIHRoaXMuc2xpZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtZW50KTtcbiAgICB0aGlzLnNsaWRlc0NvbnRhaW5lciA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3IoJy5zbGlkZXMnKTtcbiAgICB0aGlzLnNsaWRlcyA9IHRoaXMuc2xpZGVyLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3NsaWRlJyk7XG5cbiAgICAvLyBET00gY29udHJvbHMsIHVuZGVmaW5lZCB1bnRpbCBjb250cm9scyBhcmUgbG9hZGVkICh0aGVzZSBtYXkgbm90IGV4aXN0KTpcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQcmV2ID0gdGhpcy5zbGlkZXIucXVlcnlTZWxlY3RvcignLnNsaWRlci1jb250cm9sLXByZXYnKTtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xOZXh0ID0gdGhpcy5zbGlkZXIucXVlcnlTZWxlY3RvcignLnNsaWRlci1jb250cm9sLW5leHQnKTtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQbGF5ID0gdGhpcy5zbGlkZXIucXVlcnlTZWxlY3RvcignLnNsaWRlci1jb250cm9sLXBsYXknKTtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQYXVzZSA9IHRoaXMuc2xpZGVyLnF1ZXJ5U2VsZWN0b3IoJy5zbGlkZXItY29udHJvbC1wYXVzZScpO1xuXG4gICAgLy8gRm9yIHRoZSBjb250cm9scyB0byB3b3JrLCBib3RoIHByZXYgYW5kIG5leHQgKm11c3QqIGJlIHByZXNlbnQuXG4gICAgLy8gZm9yIHRoZSBhdXRvcGxheSB0byB3b3JrLCBwYXVzZSBhbmQgcGxheSAqbXVzdCogYmUgcHJlc2VudC5cbiAgICB0aGlzLmhhc0NvbnRyb2xzID0gISF0aGlzLnNsaWRlckNvbnRyb2xQcmV2ICYmICEhdGhpcy5zbGlkZXJDb250cm9sTmV4dDtcbiAgICB0aGlzLmNhbkF1dG9wbGF5ID0gISF0aGlzLnNsaWRlckNvbnRyb2xQbGF5ICYmICEhdGhpcy5zbGlkZXJDb250cm9sUGF1c2U7XG4gICAgLy8gSW1tZWRpYXRlbHkgYmxvdyB1cCBpZiB0aGVyZSBhcmUgbm8gY29udHJvbHMgYXQgYWxsOlxuICAgIGlmICghdGhpcy5oYXNDb250cm9scyAmJiAhdGhpcy5jYW5BdXRvcGxheSkgdGhyb3cgbmV3IEVycm9yKCdTbGlkZXIgY29udHJvbHMgY2Fubm90IGJlIGxvY2F0ZWQgaW4gdGhlIERPTScpO1xuXG4gICAgLy8gT3ZlcndyaXRlIHRoZSBzbGlkZXIgZGVmYXVsdHMgd2l0aCBhbnl0aGluZyBwYXNzZWQgaW4gZnJvbSBkYXRhIGF0dHJpYnV0ZXM6XG4gICAgdGhpcy5vcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5zbGlkZXIuZGF0YXNldCwgc2xpZGVyRGVmYXVsdHMpO1xuXG4gICAgLy8gU2V0IHVwIHJlbWFpbmluZyBuZWNlc3Nhcnkgc3RhdGU6XG4gICAgdGhpcy5jdXJyZW50U2xpZGUgPSAxOyAvLyBUaGUgc2xpZGVzIGFyZSAxLWluZGV4ZWQsIGFuZCBjdXJyZW50IHNsaWRlIGFsd2F5cyBzdGFydHMgYXQgMVxuICAgIHRoaXMubnVtU2xpZGVzID0gdGhpcy5zbGlkZXMubGVuZ3RoO1xuICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7IC8vIHVzZSB0byBjaGVjayBpZiBhdXRvcGxheSB0aW1lciBzaG91bGQgYmUgcmVzZXQgd2hlbiBuZXh0L3ByZXYgc2xpZGUgaXMgY2xpY2tlZFxuICAgIHRoaXMuaW50ZXJ2YWw7IC8vIGluaXRpYWxseSB1bmRlZmluZWQsIHJlZmVyZW5jZSB1c2VkIHRvIHRoZSBhdXRvcGxheSBpbnRlcnZhbFxuICB9XG5cbiAgbG9hZFJlbWFpbmluZ1NsaWRlcygpIHtcbiAgICB0aGlzLnNsaWRlc0NvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdpbWdbZGF0YS1zcmNdJykuZm9yRWFjaChpbWcgPT4ge1xuICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgaW1nLmRhdGFzZXQuc3JjKTtcbiAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiBpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNyYycpO1xuICAgIH0pO1xuICB9XG5cbiAgbG9hZENvbnRyb2xzKCkge1xuICAgIC8vIElmIHRoZXJlIGlzIG9ubHkgb25lIHNsaWRlIChvciBub25lKSwgbm8gY29udHJvbHMgbmVlZCBiZSByZW5kZXJlZDpcbiAgICBpZiAodGhpcy5udW1TbGlkZXMgPCAyKSB7XG4gICAgICBpZiAodGhpcy5oYXNDb250cm9scykge1xuICAgICAgICBbdGhpcy5zbGlkZXJDb250cm9sUHJldiwgdGhpcy5zbGlkZXJDb250cm9sTmV4dF0uZm9yRWFjaChjdHJsID0+IGN0cmwuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJykpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuY2FuQXV0b3BsYXkpIHtcbiAgICAgICAgW3RoaXMuc2xpZGVyQ29udHJvbFBsYXksIHRoaXMuc2xpZGVyQ29udHJvbFBhdXNlXS5mb3JFYWNoKGN0cmwgPT4gY3RybC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICBzZXR1cFRyYW5zaXRpb25zKCkge1xuICAgIC8vIFRoZSBzbGlkaW5nIHRyYW5zaXRpb24gaXMgaW5oZXJlbnRseSB0aWVkIHRvIHRoZSBzbGlkZXIgVUksXG4gICAgLy8g4oi1IGl0IGRlcGVuZHMgdXBvbiBrbm93aW5nIG51bWJlciBvZiBzbGlkZXM7IOKItCByZW5kZXJlZCBpbmxpbmVcbiAgICBPYmplY3QuYXNzaWduKHRoaXMuc2xpZGVzQ29udGFpbmVyLnN0eWxlLCB7XG4gICAgICB3aWR0aDogYCR7dGhpcy5udW1TbGlkZXMgKiAxMDB9JWAsXG4gICAgICB0cmFuc2l0aW9uRGVsYXk6IHRoaXMub3B0cy50cmFuc2l0aW9uRGVsYXksXG4gICAgICB0cmFuc2l0aW9uRHVyYXRpb246IHRoaXMub3B0cy50cmFuc2l0aW9uRHVyYXRpb24sXG4gICAgICB0cmFuc2l0aW9uUHJvcGVydHk6ICd0cmFuc2Zvcm0nLFxuICAgICAgdHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uOiB0aGlzLm9wdHMudHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uLFxuICAgIH0pO1xuXG4gICAgdGhpcy5hcHBseVRyYW5zbGF0aW9uKCk7XG4gIH1cblxuICBhcHBseVRyYW5zbGF0aW9uKCkge1xuICAgIGNvbnN0IHRyYW5zbGF0aW9uID0gYHRyYW5zbGF0ZVgoLSR7KHRoaXMuY3VycmVudFNsaWRlIC0gMSkgKiAoMTAwIC8gdGhpcy5udW1TbGlkZXMpfSUpYDtcbiAgICB0aGlzLnNsaWRlc0NvbnRhaW5lci5zdHlsZS50cmFuc2Zvcm0gPSB0cmFuc2xhdGlvbjtcbiAgfVxuXG5cbiAgc2hvd0N1cnJlbnQoKSB7XG4gICAgLy8gU3dpdGNoIGFyaWEtaGlkZGVuIG9uIGFuZCBvZmYgZm9yIGFjY2Vzc2liaWxpdHkgcmVhc29ucyAtIHRoZVxuICAgIC8vIG5vbi12aXNpYmxlIHNsaWRlcyBzaG91bGQgYmUgaGlkZGVuIGZyb20gYWNjZXNzaWJpbGl0eSB0b29scy5cbiAgICBbLi4udGhpcy5zbGlkZXNdLmZvckVhY2goKHNsaWRlLCBpKSA9PiB7XG4gICAgICAvLyBOT1RFIFNsaWRlcyBhcmUgMS1pbmRleGVkLCBzbyB3aGVuIGxvb3BpbmcgdGhyb3VnaCB0aGVcbiAgICAgIC8vIHNsaWRlcywgbmVlZCB0byBjb21wYXJlIGFnYWluc3QgaSArIDEuXG4gICAgICBzbGlkZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgKGkgKyAxID09PSB0aGlzLmN1cnJlbnRTbGlkZSkgPyAnZmFsc2UnIDogJ3RydWUnKTtcbiAgICB9KTtcblxuICAgIHRoaXMuYXBwbHlUcmFuc2xhdGlvbigpO1xuICB9XG5cbiAgaGFuZGxlTmV4dFNsaWRlKGUpIHtcbiAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcbiAgICB0aGlzLmN1cnJlbnRTbGlkZSA9ICh0aGlzLmN1cnJlbnRTbGlkZSArIDEgPiB0aGlzLm51bVNsaWRlcykgPyAxIDogdGhpcy5jdXJyZW50U2xpZGUgKyAxO1xuICAgIHRoaXMuc2hvd0N1cnJlbnQoKTtcbiAgICBpZiAodGhpcy5jYW5BdXRvcGxheSAmJiB0aGlzLmlzUGxheWluZykgdGhpcy5oYW5kbGVQbGF5U2xpZGVzKCk7XG4gIH1cblxuICBoYW5kbGVQcmV2U2xpZGUoZSkge1xuICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgIHRoaXMuY3VycmVudFNsaWRlID0gKHRoaXMuY3VycmVudFNsaWRlIC0gMSA9PT0gMCkgPyB0aGlzLm51bVNsaWRlcyA6IHRoaXMuY3VycmVudFNsaWRlIC0gMTtcbiAgICB0aGlzLnNob3dDdXJyZW50KCk7XG4gICAgaWYgKHRoaXMuY2FuQXV0b3BsYXkgJiYgdGhpcy5pc1BsYXlpbmcpIHRoaXMuaGFuZGxlUGxheVNsaWRlcygpO1xuICB9XG5cbiAgaGFuZGxlUGxheVNsaWRlcyhlKSB7XG4gICAgdGhpcy5zbGlkZXJDb250cm9sUGxheS5kaXNhYmxlZCA9IHRydWU7XG4gICAgdGhpcy5pc1BsYXlpbmcgPSB0cnVlO1xuICAgIHRoaXMuaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmhhbmRsZU5leHRTbGlkZSgpLCB0aGlzLm9wdHMuaW50ZXJ2YWxUaW1lKTtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQYXVzZS5kaXNhYmxlZCA9IGZhbHNlO1xuICB9XG5cbiAgaGFuZGxlUGF1c2VTbGlkZXMoZSkge1xuICAgIHRoaXMuc2xpZGVyQ29udHJvbFBhdXNlLmRpc2FibGVkID0gdHJ1ZTtcbiAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgIHRoaXMuaW50ZXJ2YWwgPSB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcbiAgICB0aGlzLnNsaWRlckNvbnRyb2xQbGF5LmRpc2FibGVkID0gZmFsc2U7XG4gIH1cblxuICBiaW5kRXZlbnRzKCkge1xuICAgIHRoaXMuc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICAgICAgY2FzZSBlLnRhcmdldCA9PT0gdGhpcy5zbGlkZXJDb250cm9sUHJldjogdGhpcy5oYW5kbGVQcmV2U2xpZGUoZSk7IGJyZWFrO1xuICAgICAgICBjYXNlIGUudGFyZ2V0ID09PSB0aGlzLnNsaWRlckNvbnRyb2xOZXh0OiB0aGlzLmhhbmRsZU5leHRTbGlkZShlKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgZS50YXJnZXQgPT09IHRoaXMuc2xpZGVyQ29udHJvbFBsYXk6IHRoaXMuaGFuZGxlUGxheVNsaWRlcyhlKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgZS50YXJnZXQgPT09IHRoaXMuc2xpZGVyQ29udHJvbFBhdXNlOiB0aGlzLmhhbmRsZVBhdXNlU2xpZGVzKGUpOyBicmVhaztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFNldCB1cCB0aGUgYXV0b3BsYXkgYWZ0ZXIgZXZlcnl0aGluZywgaW5jbHVkaW5nIGltYWdlcywgaGFzIGxvYWRlZDpcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHtcbiAgICAgIHRoaXMubG9hZFJlbWFpbmluZ1NsaWRlcygpO1xuICAgICAgaWYgKHRoaXMuY2FuQXV0b3BsYXkpIHRoaXMuaGFuZGxlUGxheVNsaWRlcygpO1xuICAgIH0pO1xuICB9XG5cbiAgaW5pdCgpIHtcbiAgICB0aGlzLmxvYWRDb250cm9scygpO1xuICAgIHRoaXMuc2V0dXBUcmFuc2l0aW9ucygpO1xuICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICB9XG59XG4iXX0=