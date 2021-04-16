export enum OS {
  WINDOWS = 'Windows',
  MAC = 'Darwin',
  LINUX = 'Linux',
  UNSUPPORTED = 'Unsupported',
}

export const getOs = () => {
  let os = OS.UNSUPPORTED;
  if (navigator.appVersion.indexOf('Win') !== -1) {
    os = OS.WINDOWS;
  } else if (navigator.appVersion.indexOf('Mac') !== -1) {
    os = OS.MAC;
  } else if (navigator.appVersion.indexOf('Linux') !== -1) {
    os = OS.LINUX;
  }

  return os;
};
