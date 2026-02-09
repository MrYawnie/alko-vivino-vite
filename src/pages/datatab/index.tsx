import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { DataTable } from '@src/components/data-table';
import { columns } from '@src/components/columns';
import { Wine } from '@src/components/columns';
import '@assets/styles/tailwind.css';
import { Button } from '@src/components/ui/button';
import { Download, RefreshCw, Trash2, Wine as WineIcon } from 'lucide-react';

const EXPIRATION_TIME = 30 * 24 * 60 * 60 * 1000; // 30 days

const DataPage: React.FC = () => {
  const [data, setData] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');

  const loadData = () => {
    setLoading(true);
    chrome.storage.local.get(null, (result) => {
      const wineData = Object.values(result) as Wine[];
      setData(wineData);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalWines = data.length;
    const winesWithRatings = data.filter(w => w.ratings_average !== null);
    const avgRating = winesWithRatings.length > 0
      ? winesWithRatings.reduce((sum, w) => sum + (w.ratings_average || 0), 0) / winesWithRatings.length
      : 0;

    const now = Date.now();
    const expiredCount = data.filter(w => now - w.timestamp > EXPIRATION_TIME).length;

    const lastUpdated = data.length > 0
      ? Math.max(...data.map(w => w.timestamp))
      : 0;

    return {
      totalWines,
      avgRating: avgRating.toFixed(2),
      expiredCount,
      lastUpdated: new Date(lastUpdated).toLocaleString('fi-FI'),
    };
  }, [data]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Country', 'Region', 'Rating', 'Reviews', 'Alcohol %', 'Price Range', 'Vintages'];

    const rows = data.map(wine => {
      const prices: number[] = [];
      Object.values(wine.vintage).forEach(v => {
        if (v.size) {
          Object.values(v.size).forEach(s => {
            if (s.price) prices.push(s.price);
          });
        }
      });

      const priceRange = prices.length > 0
        ? `${Math.min(...prices)}-${Math.max(...prices)}€`
        : 'N/A';

      const vintages = Object.keys(wine.vintage).join(', ');

      return [
        wine.alkoName || wine.name,
        wine.category,
        wine.region?.countryName || '',
        wine.region?.name || '',
        wine.ratings_average || 'N/A',
        wine.ratings_count || 0,
        wine.alcohol || 'N/A',
        priceRange,
        vintages,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `alko-vivino-wines-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete expired data
  const deleteExpiredData = () => {
    if (!confirm(`Are you sure you want to delete ${stats.expiredCount} expired wines?`)) {
      return;
    }

    const now = Date.now();
    chrome.storage.local.get(null, (result) => {
      const keysToRemove: string[] = [];

      Object.entries(result).forEach(([key, value]) => {
        const wine = value as Wine;
        if (wine.timestamp && now - wine.timestamp > EXPIRATION_TIME) {
          keysToRemove.push(key);
        }
      });

      chrome.storage.local.remove(keysToRemove, () => {
        loadData();
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <WineIcon className="w-8 h-8 text-red-700" />
            <h1 className="text-3xl font-bold text-gray-900">Alko Vivino Wine Collection</h1>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">Total Wines</div>
              <div className="text-2xl font-bold text-blue-900">{stats.totalWines}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium mb-1">Average Rating</div>
              <div className="text-2xl font-bold text-green-900">{stats.avgRating} ★</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
              <div className="text-sm text-amber-600 font-medium mb-1">Expired Data</div>
              <div className="text-2xl font-bold text-amber-900">{stats.expiredCount}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium mb-1">Last Updated</div>
              <div className="text-sm font-semibold text-purple-900">{stats.lastUpdated}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={loadData} className="flex items-center gap-2" variant="default">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button onClick={exportToCSV} className="flex items-center gap-2" variant="outline">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            {stats.expiredCount > 0 && (
              <Button onClick={deleteExpiredData} className="flex items-center gap-2" variant="destructive">
                <Trash2 className="w-4 h-4" />
                Delete Expired ({stats.expiredCount})
              </Button>
            )}
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 flex flex-col items-center justify-center">
            <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-600 text-lg">Loading wines...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 flex flex-col items-center justify-center">
            <WineIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No wines yet</h3>
            <p className="text-gray-500 text-center max-w-md">
              Visit Alko.fi product pages to start collecting wine ratings.
              They'll appear here automatically!
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <DataTable
              data={data}
              columns={columns}
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<DataPage />);
}