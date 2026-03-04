import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getMarkComplaints, reviewMarkComplaint } from '../../api/trainerApi';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import '../../styles/Page.css';

export default function TrainerComplaints() {
  const { data, loading, refetch } = useFetch(getMarkComplaints);
  const [editItem, setEditItem] = useState(null);
  const [response, setResponse] = useState('');

  async function handleReview() {
    await reviewMarkComplaint(editItem.id, { response });
    setEditItem(null);
    setResponse('');
    refetch();
  }

  return (
    <div>
      <h1 className="page-title">Mark Complaints</h1>
      {loading ? <div className="page-loading">Loading...</div> : !data?.length
        ? <div className="empty-state"><div className="empty-icon">💬</div><h3>No complaints</h3></div>
        : (
          <div className="table-card">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Subject</th><th>Course/Cert</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {data.map(c => (
                  <tr key={c.id}>
                    <td>{c.student_name}</td>
                    <td>{c.subject}</td>
                    <td>{c.course_name || c.certification_name}</td>
                    <td><Badge label={c.status} /></td>
                    <td>{c.status === 'pending' && <button className="btn-primary" style={{ padding: '4px 12px' }} onClick={() => { setEditItem(c); setResponse(''); }}>Review</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      {editItem && (
        <Modal title="Review Complaint" onClose={() => setEditItem(null)}>
          <p><strong>Student:</strong> {editItem.student_name}</p>
          <p><strong>Subject:</strong> {editItem.subject}</p>
          <p><strong>Description:</strong> {editItem.description}</p>
          <div className="form-field" style={{ marginTop: '1rem' }}><label>Your Response *</label>
            <textarea rows={4} value={response} onChange={e => setResponse(e.target.value)} placeholder="Write your response..." />
          </div>
          <div className="modal-actions">
            <button className="btn-cancel" onClick={() => setEditItem(null)}>Cancel</button>
            <button className="btn-confirm" onClick={handleReview} disabled={!response}>Submit Review</button>
          </div>
        </Modal>
      )}
    </div>
  );
}