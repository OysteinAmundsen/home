import { animate, group, query, style, transition } from '@angular/animations';

// The state of the widget before it enters the view
const hidden = { opacity: 0, scale: 0.7, width: '0' };
// The state of the widget when it rests in the view
const visible = { opacity: 1, scale: 1, width: 'auto' };
// // The state of the widget after it leaves the view
// const toState = { opacity: 0, translate: '40px 80px', scale: 0.7 };
// The time it should take to animate the widget entering or leaving
const time = '250ms ease-in';

/**
 * Animation for when widgets enter or leave the view
 */
export const dashboardAnimation = transition('* <=> *', [
  // Run both enter and leave in paralell
  group([
    // When elements enters the array
    query(':enter', [style(hidden), animate(time, style(visible))], {
      optional: true,
    }),
    // When elements leaves the array
    query(':leave', [animate(time, style(hidden))], { optional: true }),
  ]),
]);
