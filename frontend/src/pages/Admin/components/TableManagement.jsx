import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../utils/apiClient';
import TableModal from './TableModal';
import '../AdminTheme.css'; 

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

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
        const res = await apiClient(`/tables/${id}`, { method: 'DELETE' });
        if (res.ok) {
            toast.success("Table deleted");
            fetchTables();
        }
    } catch (err) {
        toast.error("Failed to delete");
    }
  };

  return (
    <div className="admin-section-container">
      <div className="admin-header-row">
        <h2 className="admin-page-title">Table Management</h2>
        <button 
            onClick={() => { setEditingTable(null); setIsModalOpen(true); }} 
            className="admin-btn"
        >
          Add New Table
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Table Number</th>
              <th>Capacity</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan="4" className="text-center py-4">Loading...</td></tr>
            ) : tables.map((table) => (
              <tr key={table.table_id}>
                <td className="font-bold">Table {table.table_number}</td>
                <td>
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-500"/> {table.capacity} Seats
                    </div>
                </td>
                <td>
                    <span className={`status-badge ${
                        table.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {table.status}
                    </span>
                </td>
                <td className="text-center">
                  <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => { setEditingTable(table); setIsModalOpen(true); }} 
                        className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                        onClick={() => handleDelete(table.table_id)} 
                        className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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