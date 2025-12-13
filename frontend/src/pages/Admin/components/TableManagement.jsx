import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Users, Plus, Filter, ArrowUpDown } from 'lucide-react'; 
import toast from 'react-hot-toast';
import apiClient from '../../../utils/apiClient';
import TableModal from './TableModal';
import '../AdminTheme.css'; 

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  
  // --- STATE FOR CONTROLS ---
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('number'); // 'number', 'cap-low', 'cap-high'

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await apiClient('/tables');
      if (response.ok) {
        setTables(await response.json());
      }
    } catch (error) {
      toast.error("Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTables(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this table?")) return;
    try {
        const res = await apiClient(`/admin/tables/${id}`, { method: 'DELETE' });
        if (res.ok) {
            toast.success("Table deleted");
            fetchTables();
        }
    } catch (err) {
        toast.error("Failed to delete");
    }
  };

  const openAddModal = () => {
    setEditingTable(null);
    setIsModalOpen(true);
  };

  // --- FILTER & SORT LOGIC ---
  const getProcessedTables = () => {
      // 1. Filter
      let result = tables.filter(table => {
          if (filterStatus === 'All') return true;
          return table.status?.toLowerCase() === filterStatus.toLowerCase();
      });

      // 2. Sort
      result.sort((a, b) => {
          switch (sortBy) {
              case 'cap-low': 
                  return a.capacity - b.capacity;
              case 'cap-high': 
                  return b.capacity - a.capacity;
              case 'number': 
              default:
                  // Numeric sort for table numbers ("1", "2", "10")
                  return parseInt(a.table_number) - parseInt(b.table_number);
          }
      });

      return result;
  };

  const filteredTables = getProcessedTables();

  const getStatusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
        case 'available': return 'bg-green-100 text-green-800';
        case 'occupied': return 'bg-red-100 text-red-800';
        case 'reserved': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="w-full">
      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
           <h2 className="admin-page-title mb-1">Table Management</h2>
           <p className="text-sm text-gray-300">Total Tables: {tables.length}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 justify-end">
            
            {/* Filter Dropdown (Orange) */}
            <div className="relative">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="admin-select-primary appearance-none pr-10" 
                    style={{ minWidth: '160px' }}
                >
                    <option value="All">All Status</option>
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Reserved">Reserved</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#3C2A21]">
                    <Filter size={18} />
                </div>
            </div>

            {/* Sort Dropdown (White) */}
            <div className="relative">
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="admin-btn bg-white text-[#3C2A21] hover:bg-gray-100 shadow-lg border border-gray-200"
                    style={{ height: '48px', minWidth: '180px' }}
                >
                    <option value="number">Table Number</option>
                    <option value="cap-low">Capacity (Low to High)</option>
                    <option value="cap-high">Capacity (High to Low)</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#3C2A21]">
                    <ArrowUpDown size={16} />
                </div>
            </div>

            {/* Add Button */}
            <button 
                onClick={openAddModal} 
                className="admin-btn admin-btn-primary flex items-center gap-2"
                style={{ height: '48px' }}
            >
              <Plus size={20} /> Add New Table
            </button>
        </div>
      </div>

      {/* 2. TABLE CONTAINER */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Table Number</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan="4" className="text-center p-8 text-gray-500">Loading tables...</td></tr>
            ) : filteredTables.length === 0 ? (
                <tr><td colSpan="4" className="text-center p-8 text-gray-500">No tables found matching filters.</td></tr>
            ) : (
                filteredTables.map((table) => (
                  <tr key={table.table_id}>
                    <td className="font-bold text-lg">Table {table.table_number}</td>
                    <td>
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-gray-400"/> 
                            <span className="font-medium">{table.capacity} Seats</span>
                        </div>
                    </td>
                    <td>
                        <span className={`status-badge ${getStatusBadgeStyle(table.status)}`}>
                            {table.status}
                        </span>
                    </td>
                    <td className="text-start">
                      <div className="flex justify-left">
                        <button 
                            onClick={() => { setEditingTable(table); setIsModalOpen(true); }} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                            onClick={() => handleDelete(table.table_id)} 
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <TableModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchTables}
        tableToEdit={editingTable}
      />
    </div>
  );
};

export default TableManagement;