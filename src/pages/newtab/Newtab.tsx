import React, { useEffect, useState } from 'react';
import '@pages/newtab/Newtab.css';
import { DataTable } from '@src/components/data-table';
import { columns } from '@src/components/columns';
import { Wine } from '@src/components/columns';

export default function Newtab(): JSX.Element {
  const [data, setData] = useState<Wine[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      chrome.storage.local.get(null, (result) => {
        const data = Object.values(result) as Wine[];
        setData(data);
      });
    };
    fetchData();
  }, []);

  return (
    <div className="App">
      <DataTable data={data} columns={columns} />
    </div>
  );
}
