// import { getWindowConfig as getSpeedBarSuggestionsWindowConfig } from './window-config';

export const keepSpeedbarSuggestionsOnTop = () => {
  // const suggestionWindow = fin.desktop.Window.getCurrent();
  // suggestionWindow.bringToFront();
};

const fin = {

}

export const getSpeedBarSuggestionsWindow = () => {
  return new Promise(async (resolve, reject) => {
    const finApp = fin.desktop.Application.getCurrent();
    // const suggestionsWindowConfig = await getSpeedBarSuggestionsWindowConfig();
    const suggestionsWindowConfig = {};
    finApp.getChildWindows((childWindows) => {
      const suggestionsWindow = childWindows.find(
        childWindow => childWindow.name === suggestionsWindowConfig.name
      );
      if (typeof suggestionsWindow === 'undefined') {
        reject(`Window '${suggestionsWindowConfig.name}' cannot be found`);
        return;
      }
      resolve(suggestionsWindow);
    }, reject);
  })
};

export const updateSpeedbarSuggestionsWindowPosition = (
  parentWindowBounds,
  suggestionWindow
) => {
  if (!parentWindowBounds) {
    console.warn('Cannot update window position: Missing required parent window bounds');
    return;
  }
  const { left, top, width, height } = parentWindowBounds;
  const currentWindow = suggestionWindow || fin.desktop.Window.getCurrentQ;
  currentWindow.setBounds(left, top, width, height);
}

export const showSpeedbarSuggestionsWindow = (
  parentWindowBounds
) => {
  const suggestionWindow = fin.desktop.Window.getCurrent();
  if (parentWindowBounds) {
    updateSpeedbarSuggestionsWindowPosition(parentWindowBounds, suggestionWindow);
  }
  suggestionWindow.show();
  focusSpeedbarSuggestionsWindow();
};

export const focusSpeedbarSuggestionsWindow = (
  suggestionWindow = fin.desktop.Window.getCurrent()
) => {
  suggestionWindow.bringToFront();
  suggestionWindow.focus();
};

export const hideSpeedbarSuggestionsWindow = () => {
  const suggestionWindow = fin.desktop.Window.getCurrent();
  suggestionWindow.hide();
};