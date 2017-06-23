function noop() { return void 0; }
/**
 * Creates and initialises a slider. If the slider is not
 * fully initialised, the page shouold just render a single slide,
 * with no controls.
 *
 * REVIEW all slide-to code should be in one handler, call that with params
 * REVIEW too much state, reduce if poss
 */

class Slider {
  constructor(element) {

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

  setupControls() {
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
        [this.sliderControlPrev, this.sliderControlNext].forEach(ctrl => ctrl.setAttribute('aria-hidden', 'true'));
      }
      if (this.canPlay) {
        [this.sliderControlPlay, this.sliderControlPause].forEach(ctrl => ctrl.setAttribute('aria-hidden', 'true'));
      }
      if (this.hasIndicators)  {
        this.sliderIndicatorsContainer.setAttribute('aria-hidden', 'true');
      }
    }
  }

  loadRemainingSlides() {
    [...this.slidesContainer.querySelectorAll('img[data-src]')].forEach(img => {
      img.setAttribute('src', img.dataset.src);
      img.onload = () => img.removeAttribute('data-src');
    });
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

  handleSlideTo(n) {
    window.clearInterval(this.interval);
    this.currentSlide = n;
    this.showCurrent();
    if (this.canPlay && this.isPlaying) this.handlePlaySlides();
  }

  handleIndicatorSelect(e) {
    const selectedSlideIndex = [...this.sliderIndicatorsContainer.children].indexOf(e.target);
    this.handleSlideTo(selectedSlideIndex + 1);
  }

  handleNextSlide(e) {
    this.handleSlideTo((this.currentSlide + 1 > this.numSlides) ? 1 : this.currentSlide + 1);
  }

  handlePrevSlide(e) {
    this.handleSlideTo((this.currentSlide - 1 === 0) ? this.numSlides : this.currentSlide - 1);
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
        case e.target == this.sliderControlPrev: this.handlePrevSlide(e); break;
        case e.target == this.sliderControlNext: this.handleNextSlide(e); break;
        case e.target == this.sliderControlPlay: this.handlePlaySlides(e); break;
        case e.target == this.sliderControlPause: this.handlePauseSlides(e); break;
        case this.sliderIndicatorsContainer.contains(e.target): this.handleIndicatorSelect(e); break;
      }
    });

    // Once everything on the page, including images, has loaded, load the
    // remaining slide images and start playing slides if autoplay option is true:
    window.addEventListener('load', () => {
      this.loadRemainingSlides();
      if (this.canPlay) {
        switch (this.opts.autoplay) {
          case 'true': this.handlePlaySlides(); break;
          case 'false': this.handlePauseSlides(); break;
        }
      }
    });
  }
}
