/**
 * Creates and initialises a slider. If the slider is not
 * fully initialised, the page shouold just render a single slide,
 * with no controls.
 */

class Slider {
  constructor(element) {

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

  loadRemainingSlides() {
    [...this.slidesContainer.querySelectorAll('img[data-src]')].forEach(img => {
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
      if (this.hasIndicators)  {
        this.sliderIndicatorsContainer.setAttribute('aria-hidden', 'true');
      }
    }
  }


  setupTransitions() {
    // The sliding transition is inherently tied to the slider UI,
    // ∵ it depends upon knowing number of slides; ∴ rendered inline
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

  setIndicator() {
    [...this.sliderIndicators].forEach((indicator, i) => {
      indicator.setAttribute('aria-selected', (i + 1 === this.currentSlide) ? 'true' : 'false');
    });
  }


  showCurrent() {
    // Switch aria-hidden on and off for accessibility reasons - the
    // non-visible slides should be hidden from accessibility tools.
    [...this.slides].forEach((slide, i) => {
      // NOTE Slides are 1-indexed, so when looping through the
      // slides, need to compare against i + 1.
      slide.setAttribute('aria-hidden', (i + 1 === this.currentSlide) ? 'false' : 'true');
    });
    this.setIndicator();
    this.applyTranslation();
  }

  handleIndicatorSelect(e) {
    window.clearInterval(this.interval);
    const selectedSlideIndex = [...this.sliderIndicatorsContainer.children].indexOf(e.target);
    this.currentSlide = selectedSlideIndex + 1;
    this.showCurrent();
    if (this.canAutoplay && this.isPlaying) this.handlePlaySlides();
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
    this.interval = setInterval(() => this.handleNextSlide(), this.opts.intervalTime);
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
        case this.sliderIndicatorsContainer.contains(e.target): this.handleIndicatorSelect(e); break;
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
