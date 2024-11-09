import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DataTable } from '@src/components/data-table';
import { columns } from '@src/components/columns';
import { Wine } from '@src/components/columns';
import '@assets/styles/tailwind.css';

const DataPage: React.FC = () => {
  const [data, setData] = useState<Wine[]>([]);

  useEffect(() => {
    chrome.storage.local.get(null, (result) => {
      const data = Object.values(result) as Wine[];
      setData(data);
    });
  }, []);

  return (
    <div className="App">
      <DataTable data={data} columns={columns} />
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<DataPage />);
}