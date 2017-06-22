/**
 * Creates and initialises a slider. If the slider is not
 * fully initialised, the page shouold just render a single slide,
 * with no controls.
 */

class Slider {
  constructor(element) {
    const sliderDefaults = {
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

    // For the controls to work, both prev and next _must_ be present.
    // for the autoplay to work, pause and play _must_ be present.
    this.hasControls = !!this.sliderControlPrev && !!this.sliderControlNext;
    this.canAutoplay = !!this.sliderControlPlay && !!this.sliderControlPause;
    // Immediately blow up if there are no controls at all:
    if (!this.hasControls && !this.canAutoplay) throw new Error('Slider controls cannot be located in the DOM');

    this.opts = Object.assign({}, this.slider.dataset, sliderDefaults);


    this.intervalTime = this.opts.intervalTime; // Amount of time in ms each slide should be visible
    this.currentSlide = 1; // The slides are 1-indexed, and current slide always starts at 1
    this.numSlides = this.slides.length; // NOTE only initial slide image should load until document fully ready
    this.isPlaying = false; // use to check if autoplay timer should be reset when next/prev slide is clicked
    this.interval; // initially undefined, reference used to the autoplay interval
  }

  loadRemainingSlides() {
    this.slidesContainer.querySelectorAll('img[data-src]').forEach(img => {
      img.setAttribute('src', img.dataset.src);
      img.onload = () => img.removeAttribute('data-src');
    });
  }

  loadControls() {
    // If there is only one slide (or none), no controls need be rendered:
    if (this.numSlides < 2) {
      if (this.hasControls) {
        [this.sliderControlPrev, this.sliderControlNext].forEach(ctrl => ctrl.setAttribute('aria-hidden', 'true'));
      }
      if (this.canAutoplay) {
        [this.sliderControlPlay, this.sliderControlPause].forEach(ctrl => ctrl.setAttribute('aria-hidden', 'true'));
      }
    }
  }

  /**
   * Transitions are inherently tied to the slider UI, and depend upon
   * the number of slides to accurately calculate the % change in position.
   * The setup function applies the correct % width for the overall
   * constainer, then immedaitely applies a translateX value to
   * position the slides.
   */
  setupTransitions() {
    Object.assign(this.slidesContainer.style, {
      width: `${this.numSlides * 100}%`,
      transitionDelay: this.opts.transitionDelay,
      transitionDuration: this.opts.transitionDuration,
      transitionProperty: 'transform',
      transitionTimingFunction: this.opts.transitionTimingFunction,
    });

    this.applyTranslation();
  }

  applyTranslation() {
    const translation = `translateX(-${(this.currentSlide - 1) * (100 / this.numSlides)}%)`;
    this.slidesContainer.style.transform = translation;
  }

  /**
   * [showCurrent description]
   * @return {[type]} [description]
   */
  showCurrent() {
    // Switch aria-hidden on and off for accessibility reasons - the
    // non-visible slides should be hidden from accessibility tools.
    [...this.slides].forEach((slide, i) => {
      // NOTE Slides are 1-indexed, so when looping through the
      // slides, need to compare against i + 1.
      slide.setAttribute('aria-hidden', (i + 1 === this.currentSlide) ? 'false' : 'true');
    });

    this.applyTranslation();
  }

  handleNextSlide(e) {
    window.clearInterval(this.interval);
    this.currentSlide = (this.currentSlide + 1 > this.numSlides) ? 1 : this.currentSlide + 1;
    this.showCurrent();
    if (this.canAutoplay && this.isPlaying) this.handlePlaySlides();
  }

  handlePrevSlide(e) {
    window.clearInterval(this.interval);
    this.currentSlide = (this.currentSlide - 1 === 0) ? this.numSlides : this.currentSlide - 1;
    this.showCurrent();
    if (this.canAutoplay && this.isPlaying) this.handlePlaySlides();
  }

  handlePlaySlides(e) {
    this.sliderControlPlay.disabled = true;
    this.isPlaying = true;
    this.interval = setInterval(() => this.handleNextSlide(), this.intervalTime);
    this.sliderControlPause.disabled = false;
  }

  handlePauseSlides(e) {
    this.sliderControlPause.disabled = true;
    this.isPlaying = false;
    this.interval = window.clearInterval(this.interval);
    this.sliderControlPlay.disabled = false;
  }

  bindEvents() {
    this.slider.addEventListener('click', e => {
      switch (true) {
        case e.target === this.sliderControlPrev: this.handlePrevSlide(e); break;
        case e.target === this.sliderControlNext: this.handleNextSlide(e); break;
        case e.target === this.sliderControlPlay: this.handlePlaySlides(e); break;
        case e.target === this.sliderControlPause: this.handlePauseSlides(e); break;
      }
    });

    // Set up the autoplay after everything, including images, has loaded:
    window.addEventListener('load', () => {
      this.loadRemainingSlides();
      if (this.canAutoplay) this.handlePlaySlides();
    });
  }

  init() {
    this.loadControls();
    this.setupTransitions();
    this.bindEvents();
  }
}
