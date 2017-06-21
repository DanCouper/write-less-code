const sliderDefaults = {
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

class Slider {
  constructor(element) {
    // DOM selection:
    this.slider = document.querySelector(element);
    this.slidesContainer = this.slider.querySelector('.slides');
    this.slides = this.slider.getElementsByClassName('slide');
    // Template selection (these may not exist):
    this.sliderControlsPrevTemplate = this.slider.querySelector('.slider-controls-prev-template');
    this.sliderControlsNextTemplate = this.slider.querySelector('.slider-controls-next-template');
    this.sliderAutoplayControlsPlayTemplate = this.slider.querySelector('.slider-autoplay-controls-play-template');
    this.sliderAutoplayControlsPauseTemplate = this.slider.querySelector('.slider-autoplay-controls-pause-template');
    // DOM controls, undefined until controls are loaded (these may not exist):
    this.sliderControlPrev;
    this.sliderControlNext;
    this.sliderControlPlay;
    this.sliderControlPause;

    const opts = Object.assign(this.slider.dataset, sliderDefaults);

    // Slider controls state:
    this.hasControls = Boolean(this.sliderControlsPrevTemplate) && Boolean(this.sliderControlsNextTemplate); // cast object to bool to check for existance
    this.canAutoplay = Boolean(this.sliderAutoplayControlsPlayTemplate) && Boolean(this.sliderAutoplayControlsPauseTemplate); // cast object to bool to check for existance

    if (!this.hasControls && !this.canAutoplay) throw new Error('Slider has neither controls nor autoplay functionality so cannot act as a slider.');

    this.intervalTime = opts.intervalTime; // Amount of time in ms each slide should be visible
    this.currentSlide = 1; // The slides are 1-indexed, and current slide always starts at 1
    this.numSlides = 1; // The number of slides inits at 1, and is corrected when remaining slides are loaded
    this.isPlaying = false; // use to check if autoplay timer should be reset when next/prev slide is clicked
    this.interval; // initially undefined, reference used to the autoplay interval
  }

  loadSlides() {
    // TODO stub function, this method should lazy load the remaining slides
    this.numSlides = this.slides.length;
  }


  /**
   * Transitions are inherently tied to the slider UI, and depend upon
   * the number of slides to accurately calculate the % change in position.
   * The setup function applies the correct % width for the overall
   * constainer, and the apply function is ran each time a next/prev
   * handler is triggered to apply the corect trnslation.
   */
  setupTransitions() {
    this.slidesContainer.style.width = `${this.numSlides * 100}%`;
    this.applyTransitions();
  }

  applyTransitions() {
    const translation = `translateX(-${(this.currentSlide - 1) * (100 / this.numSlides)}%)`;
    this.slidesContainer.style.transform = translation;
  }

  loadControls() {
    if (this.hasControls && this.numSlides > 1) {
      this.slider.appendChild(this.sliderControlsPrevTemplate.content.cloneNode(true));
      this.slider.appendChild(this.sliderControlsNextTemplate.content.cloneNode(true));
      // Add the control references to the state:
      this.sliderControlPrev = this.slider.getElementsByClassName('slider-control-prev')[0];
      this.sliderControlNext = this.slider.getElementsByClassName('slider-control-next')[0];
    }
  }

  loadAutoplayControls() {
    if (this.canAutoplay && this.numSlides > 1) {
      this.slider.appendChild(this.sliderAutoplayControlsPlayTemplate.content.cloneNode(true));
      this.slider.appendChild(this.sliderAutoplayControlsPauseTemplate.content.cloneNode(true));
      // Add the autoplay control references to the state:
      this.sliderControlPlay = this.slider.getElementsByClassName('slider-control-play')[0];
      this.sliderControlPause = this.slider.getElementsByClassName('slider-control-pause')[0];
    }
  }

  showCurrent() {
    [...this.slides].forEach((slide, i) => {
      this.applyTransitions();
      if (i + 1 === this.currentSlide) {
        slide.setAttribute('aria-hidden','false');
      } else {
        slide.setAttribute('aria-hidden','true');
      }
    });
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
      if (this.canAutoplay) this.handlePlaySlides();
    });
  }

  init() {
    this.loadSlides();
    this.setupTransitions();
    this.loadControls();
    this.loadAutoplayControls();
    this.bindEvents();
  }
}
