'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sliderDefaults = {
  intervalTime: 4000
};

/**
 * Creates and initialises a slider. If the slider is not
 * fully initialised, the page will just render a single slide,
 * with no controls.
 *
 * Boot happens in a series of steps:
 *
 *   - The slider script is attached to an element.
 *   - Options are read from the data attributes, falling back to defaults.
 *   - TODO The templates containing the remaining slides are activated
 *     in sequence: this means the images contained can be lazily
 *     loaded well after initial page render.
 *   - If the prev/next controls are to be used, the template containing
 *     them is activated.
 *   - If autoplay is to be used, the template containing the
 *     autoplay controls (play/pause) is activated and the
 *     interval initialised.
 * @type {[type]}
 */

var Slider = function () {
  function Slider(element) {
    _classCallCheck(this, Slider);

    // DOM selection:
    this.slider = document.querySelector(element);
    this.slideContainer = this.slider.querySelector('.slides');
    this.slides = this.slider.getElementsByClassName('slide');
    // Template selection (these may not exist):
    this.sliderControlsTemplate = this.slider.querySelector('.slider-controls-template');
    this.sliderAutoplayControlsTemplate = this.slider.querySelector('.slider-autoplay-controls-template');
    // DOM controls, undefined until controls are loaded (these may not exist):
    this.sliderControlPrev;
    this.sliderControlNext;
    this.sliderControlPlay;
    this.sliderControlPause;

    var opts = Object.assign(this.slider.dataset, sliderDefaults);

    // Slider controls state:
    this.hasControls = Boolean(this.sliderControlsTemplate); // cast object to bool to check for existance
    this.canAutoplay = Boolean(this.sliderAutoplayControlsTemplate); // cast object to bool to check for existance

    if (!this.hasControls && !this.canAutoplay) throw new Error('Slider has neither controls nor autoplay functionality so cannot act as a slider.');

    this.intervalTime = opts.intervalTime; // Amount of time in ms each slide should be visible
    this.currentSlide = 1; // The slides are 1-indexed, and current slide always starts at 1
    this.numSlides = 1; // The number of slides inits at 1, and is corrected when remaining slides are loaded
    this.isPlaying = false; // use to check if autoplay timer should be reset when next/prev slide is clicked
    this.interval; // initially undefined, reference used to the autoplay interval
  }

  _createClass(Slider, [{
    key: 'loadSlides',
    value: function loadSlides() {
      // TODO stub function, this method should lazy load the remaining slides
      this.numSlides = this.slides.length;
    }
  }, {
    key: 'setupTransitions',
    value: function setupTransitions() {
      this.slideContainer.style.width = this.numSlides * 100 + '%';
      this.applyTransitions();
    }
  }, {
    key: 'applyTransitions',
    value: function applyTransitions() {
      var transitionPercent = 100 / this.numSlides;
      var transitionProp = 'translateX(-' + (this.currentSlide - 1) * transitionPercent + '%)';
      this.slideContainer.style.transform = transitionProp;
    }
  }, {
    key: 'loadControls',
    value: function loadControls() {
      if (this.hasControls && this.numSlides > 1) {
        this.slider.appendChild(this.sliderControlsTemplate.content.cloneNode(true));
        // Add the control references to the state:
        this.sliderControlPrev = this.slider.getElementsByClassName('slider-control-prev')[0];
        this.sliderControlNext = this.slider.getElementsByClassName('slider-control-next')[0];
      }
    }
  }, {
    key: 'loadAutoplayControls',
    value: function loadAutoplayControls() {
      if (this.canAutoplay && this.numSlides > 1) {
        this.slider.appendChild(this.sliderAutoplayControlsTemplate.content.cloneNode(true));
        // Add the autoplay control references to the state:
        this.sliderControlPlay = this.slider.getElementsByClassName('slider-control-play')[0];
        this.sliderControlPause = this.slider.getElementsByClassName('slider-control-pause')[0];
      }
    }
  }, {
    key: 'showCurrent',
    value: function showCurrent() {
      var _this = this;

      [].concat(_toConsumableArray(this.slides)).forEach(function (slide, i) {
        _this.applyTransitions();
        if (i + 1 === _this.currentSlide) {
          slide.setAttribute('aria-hidden', 'false');
        } else {
          slide.setAttribute('aria-hidden', 'true');
        }
      });
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
      }, this.intervalTime);
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
        if (_this3.canAutoplay) _this3.handlePlaySlides();
      });
    }
  }, {
    key: 'init',
    value: function init() {
      this.loadSlides();
      this.setupTransitions();
      this.loadControls();
      this.loadAutoplayControls();
      this.bindEvents();
    }
  }]);

  return Slider;
}();
