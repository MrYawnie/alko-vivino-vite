import React, { useEffect, useState } from 'react';
import icon128 from '../../../public/icon-128.png';

export default function Popup(): JSX.Element {
  const [resultCount, setResultCount] = useState<number>(0);

  useEffect(() => {
    chrome.storage.local.get(null, (data) => {
      const count = Object.keys(data).length;
      setResultCount(count);
    });
  }, []);

  const openWinesPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/pages/datatab/index.html') });
  };

  const flushLocalStorage = () => {
    const confirmed = window.confirm('Are you sure you want to flush the local storage?');
    if (confirmed) {
      chrome.storage.local.clear(() => {
        setResultCount(0);
      });
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 text-center h-full p-3 bg-gray-800">
      <header className="flex items-center justify-between text-center text-white space-x-4 mb-5">
        <h1 className="text-xl font-semibold text-center">Alko Vivino Extension</h1>
      </header>
      <main className="flex items-center justify-between text-white space-x-4">
        <img src={icon128} alt="icon" className="w-24 h-24" />
        <div className="flex flex-col items-center space-y-4">
          <p className="text-green-400">You have {resultCount} results saved in local storage!</p>
          <button
            onClick={openWinesPage}
            className="mt-4 p-2 bg-blue-600 rounded text-white hover:bg-blue-700 transition duration-300"
          >
            Open Wines Page
          </button>
          <button
            onClick={flushLocalStorage}
            className="mt-4 p-2 bg-red-600 rounded text-white hover:bg-red-700 transition duration-300"
          >
            Flush Local Storage
          </button>
        </div>
      </main>
    </div>
  );
}