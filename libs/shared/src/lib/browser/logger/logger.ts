/**
 * Common function to style console log messages to a common form
 *
 * @param level the type of log message to display
 * @param category The category of the log message
 * @param args The message to log
 * @returns a formatted array of arguments to pass to console.log
 */
export function logMsg(level: 'info' | 'debug' | 'warn' | 'error', category: string, ...args: any): any[] {
  const [message, ...rest] = args;
  const color = level === 'error' ? 'red' : level === 'debug' ? 'blue' : 'green';
  const style = `background: ${color}; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;`;
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const timeStyle = `color: gray; font-size: 12px;`;

  return [
    `%c${category}%c [${time}]%c`, // Third %c for unstyled text after time
    style,
    timeStyle,
    '', // No style for the rest
    message,
    ...rest,
  ];
}
