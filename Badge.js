/*
 * Badge Train Widget v1
 * Based off of Alpha Sub Train widget v3.1.0 by thefyrewire (@MikeyHay)
 * Inspired by Sam Woodhall's custom Stream HUD badge widget (@SamCWoodhall)
 * - Greaus(@GreausTv)
*/

const prefs = {};
let trainTimeout, trainTimeoutLock, trainAmount = 0, trainLocked = false, sane = false, trainLine, trainStation, trainRunning = false, gifts = 0, totalGifts = 0, trainVariant = 'Start';
const backgroundContainer = document.querySelector('.background-container');
const container = document.querySelector('.container');
const logoContainer = document.querySelector('.logo-container');
const trainContainer = document.querySelector('.text-train-container');
const textContainer = document.querySelector('.text-train');
const image = (src) => {
  const i = document.createElement('img');
  i.className = 'logo';
  i.src = src;
  return i;
}


window.addEventListener('onWidgetLoad', obj => {
  const fields = obj.detail.fieldData;
  if (fields.trainTime < 0) return;
  prefs.trainTime = fields.trainTime;
  prefs.trainTheme = fields.trainTheme;
  prefs.trainType = fields.trainType;
  prefs.trainOrientation = (fields.trainOrientation === 'horizontal') ? 'left' : 'top';
  prefs.trainDirection = fields.trainDirection;
  prefs.trainGiftTriggers = fields.trainGiftTriggers;
  prefs.trainTipLocale = fields.trainTipLocale;
  prefs.trainTipCurrency = (fields.trainTipCurrency.trim().length > 0) ? fields.trainTipCurrency.trim() : 'USD';
  prefs.lineThickness = (fields.lineThickness > 0) ? fields.lineThickness : 0;
  const textTrain = '<div class="text-train"></div>';
  $('.container').append('<div class="container-train"></div>');

  if (fields.backgroundType !== 'none') {
    if (fields.backgroundType === 'solidColor')container.style.backgroundColor = fields.backgroundSolidColor;
  }
  switch (prefs.trainOrientation) {
    case 'left':
      $('.container, .container-train').css('flex-direction', 'row');
      $('.container-train').css('width', `100%`);
      break;
    case 'top':
      $('.container, .container-train').css('flex-direction', 'column');
      $('.container-train').css('height', `100%`);
      break;
  }
  $('.text-train-container').width(((prefs.trainType === 'cheer-latest' || prefs.trainType === 'sparks-latest' || prefs.trainType === 'embers-latest' || prefs.trainType === 'stars-latest') && (prefs.trainDirection === 'left' || prefs.trainDirection === 'center-left')) ? '120px' : '80px');

  if (fields.trainMode.includes('preview')) {
    switch (prefs.trainType) {
      case 'follower-latest':
      case 'follower-latest-mx':
      case 'subscriber-latest':
      case 'subscriber-latest-yt':
      case 'subscriber-latest-mx':
      case 'sponsor-latest':
      case 'follower-latest-fb':
      case 'videolike-latest':
      case 'share-latest':
      case 'fan-latest':
      case 'supporter-latest':
        prefs.testAmount = `${(Math.floor(Math.random()*20)+1)}`;
        break;
      case 'cheer-latest':
      case 'sparks-latest':
      case 'embers-latest':
      case 'stars-latest':
        const cheers = ['5', '10', '100', '2000'];
        prefs.testAmount = cheers[Math.floor(Math.random()*cheers.length)];
        break;
      case 'tip-latest':
      case 'tip-latest-yt':
      case 'tip-latest-mx':
      case 'superchat-latest':
      case 'tip-latest-fb':
        prefs.testAmount = currencyConversion((Math.random()*20)+1);
        break;
    }
    $('.text-train').text(prefs.testAmount);
    $('.text-train-container').css('visibility', 'visible');
    logoContainer.setAttribute('data-hidden', true);
  }

    $('.container-train').append('<div class="line"></div><div class="line-bg"></div>');
    switch (prefs.trainOrientation) {
      case 'left':
        $('.line, .line-bg').css('width', '100%').css('height', `100%`);
        prefs.lineScale = 'scaleX';
        break;
      case 'top':
        $('.line, .line-bg').css('height', '100%').css('width', `100%`);
        prefs.lineScale = 'scaleY';
        break;
    }

    switch (fields.lineStyle) {
      case 'single':
        $('.line').css('background-color', '{{lineColor}}');
        break;
      case 'gradient':
      case 'custom':
        const colors = (fields.lineStyle === 'gradient') ? '{{lineColor}} 0%, {{lineColor2}} 100%' : '{{lineGradientCustom}}';
        switch (prefs.trainOrientation) {
          case 'left':
            $('.line').css('background', `linear-gradient(to ${(fields.lineGradientDirection === 'lengthways') ? 'right' : 'bottom'}, ${colors})`);
            break;
          case 'top':
            $('.line').css('background', `linear-gradient(to ${(fields.lineGradientDirection === 'lengthways') ? 'bottom' : 'right'}, ${colors})`);
            break;
        }
        break;
    }
	
  prefs.logoType = fields.logoType;
  if (prefs.logoType !== 'none') {
    if (prefs.logoType === 'image') {
      if (fields.logoExternalImage.length > 0) logoContainer.appendChild(image(fields.logoExternalImage));
      else if (fields.logoImage.length > 0) logoContainer.appendChild(image(fields.logoImage));
    } 
    else if (fields.logoVideo.length > 0) logoContainer.appendChild(video(fields.logoVideo, 'logo'));
  }
  
  if (fields.maskType !== 'none') {
    if (fields.maskType === 'circle') container.style.clipPath = 'circle(48vw at 50vw 50vh)';
    else if (fields.maskType === 'square') container.style.clipPath = 'inset(5vh 5vh 5vh 5vh)';
    else if (fields.maskType === 'round-corners'){
      if (fields.cornerType === 'pixels') container.style.borderRadius = fields.roundnessPx + 'px';
      else container.style.borderRadius = fields.roundness + '%';
    }
  }

    trainAnimation(100, 0);
    $('.line, .line-bg').css('clip-path', prefs.trainClipEnd);

    if (fields.trainMode.includes('preview')) {
      trainAnimation(fields.lineStyle === 'single' ? 70 : 100, 100);
      $('.line').css('clip-path', prefs.trainClipStart);
      $('.line-bg').css('clip-path', prefs.trainClipEnd);
      return;
    }
  
  sane = true;
});

window.addEventListener('onEventReceived', obj => {
  if (!sane || trainLocked) return;
  if (obj.detail.listener !== prefs.trainType.split('-').slice(0, 2).join('-')) {
    SE_API.resumeQueue();
    return;
  }
  const event = obj.detail.event;
  switch (prefs.trainType) {
    case 'subscriber-latest':
    case 'subscriber-latest-mx':
      if (event.bulkGifted && prefs.trainGiftTriggers === 'yes') {
        totalGifts = event.amount;
        SE_API.resumeQueue();
      } else if (event.gifted && event.isCommunityGift && prefs.trainGiftTriggers === 'yes') {
        gifts++;
        if (gifts === totalGifts) trainCountIncrease(totalGifts);
        else SE_API.resumeQueue();
      } else if (event.gifted && event.sender !== event.name && prefs.trainGiftTriggers === 'yes') {
        trainCountIncrease(1);
      } else if (!event.gifted && !event.bulkGifted) {
        trainCountIncrease(1);
      }
      break;
    case 'cheer-latest':
    case 'tip-latest':
    case 'tip-latest-yt':
    case 'tip-latest-mx':
    case 'superchat-latest':
    case 'sparks-latest':
    case 'embers-latest':
    case 'stars-latest':
    case 'tip-latest-fb':
      trainCountIncrease(event.amount);
      break;
    case 'follower-latest':
    case 'follower-latest-mx':
    case 'subscriber-latest-yt':
    case 'sponsor-latest':
    case 'follower-latest-fb':
    case 'videolike-latest':
    case 'share-latest':
    case 'fan-latest':
    case 'supporter-latest':
      trainCountIncrease(1);
      break;
    default:
      SE_API.resumeQueue();
      return;
  }
});

const trainCountIncrease = (amount) => {
  if (trainTimeout) trainStationApproaches();
  trainAmount += amount;
  gifts = 0;
  totalGifts = 0;
  $('.text-train').text((prefs.trainType.split('-').slice(0, 2).join('-') === 'tip-latest' || prefs.trainType === 'superchat-latest') ? currencyConversion(trainAmount) : trainAmount);
  logoContainer.setAttribute('data-hidden', true);
  $('.text-train-container').css('visibility', 'visible').css('animation', 'bounceIn 0.5s forwards');
      doTheLineDanceRoutine();
}

const doTheLineDanceRoutine = () => {
  if (trainTimeout) trainStationApproaches();
  if (trainLine || trainStation) {
    trainLine.pause();
    trainLine = null;
    trainStation.pause();
    trainStation = null;
  }
  trainStation = anime({targets: `.line${!trainRunning ? ', .line-bg' : ''}`, 'clip-path': (!trainRunning && prefs.trainDirection.includes('center')) ? [(prefs.trainOrientation === 'left') ? 'inset(0 50% 0 50%)' : 'inset(50% 0 50% 0)', prefs.trainClipStart] : prefs.trainClipStart, duration: 1e3, easing: 'easeInOutQuart'});

  setTimeout(() => {
    trainRunning = true;
    trainLine = anime({targets: '.line', 'clip-path': prefs.trainClipEnd, duration: prefs.trainTime*1e3, easing: 'linear'});
    trainTimeout = setTimeout(() => {
      trainLocked = true;
      trainAmount = 0;
      anime({targets: '.line-bg', 'clip-path': prefs.trainClipEnd, duration: 1e3, easing: 'easeInOutQuart'});
      setTimeout(() => {
        $('.text-train-container').css('animation', 'bounceOut 0.5s forwards');
        setTimeout(() => $('.text-train-container').css('visibility', 'hidden'), 500);
        logoContainer.removeAttribute('data-hidden');
        trainRunning = false;
        trainStationApproaches();
      }, 1e3);
    }, prefs.trainTime*1e3);
  }, 1e3);
}

const currencyConversion = (amount) => {
  try {
    const c = amount.toLocaleString(prefs.trainTipLocale, {style: 'currency', currency: prefs.trainTipCurrency, minimumFractionDigits: 2});
    return c.substr(-3) === '.00' ? c.substr(0, c.length-3) : c;
  } catch(e) {
    return amount;
  }
}

const trainAnimation = (start, end) => {
  start = 100 - start;
  end = 100 - end;
  if (prefs.trainOrientation === 'left' && prefs.trainDirection === 'left') {
    prefs.trainClipStart = `inset(0px ${start}% 0px 0px)`;
    prefs.trainClipEnd = `inset(0px ${end}% 0px 0px)`;
  } else if (prefs.trainOrientation === 'left' && prefs.trainDirection === 'right') {
    prefs.trainClipStart = `inset(0px 0px 0px ${start}%)`;
    prefs.trainClipEnd = `inset(0px 0px 0px ${end}%)`;
  } else if (prefs.trainOrientation === 'left' && prefs.trainDirection.includes('center')) {
    prefs.trainClipStart = `inset(0px ${start/2}% 0px ${start/2}%)`;
    prefs.trainClipEnd = `inset(0px ${end/2}% 0px ${end/2}%)`;
  } else if (prefs.trainOrientation === 'top' && prefs.trainDirection === 'left') {
    prefs.trainClipStart = `inset(0px 0px ${start}% 0px)`;
    prefs.trainClipEnd = `inset(0px 0px ${end}% 0px)`;
  } else if (prefs.trainOrientation === 'top' && prefs.trainDirection === 'right') {
    prefs.trainClipStart = `inset(${start}% 0px 0px 0px)`;
    prefs.trainClipEnd = `inset(${end}% 0px 0px 0px)`;
  } else if (prefs.trainOrientation === 'top' && prefs.trainDirection.includes('center')) {
    prefs.trainClipStart = `inset(${start/2}% 0px ${start/2}% 0px)`;
    prefs.trainClipEnd = `inset(${end/2}% 0px ${end/2}% 0px)`;
  }
}

const trainStationApproaches = () => {
  clearTimeout(trainTimeout);
  trainTimeout = null;
  clearTimeout(trainTimeoutLock);
  trainTimeoutLock = null;
  trainLocked = false;
}
