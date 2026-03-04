import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';

const ChildSelection = () => {
    const { studentId } = useParams();
    const [child, setChild] = useState(null);

    useEffect(() => {
        const fetchChild = async () => {
            try {
                const response = await api.get(`/parent/child/${studentId}`);
                setChild(response.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchChild();
    }, [studentId]);

    if (!child) return <div>Loading child data...</div>;

    return (
        <div className="page-container">
            <h1>Monitoring: {child.full_name}</h1>
            <div className="child-menu">
                <Link to={`/parent/child/${studentId}/timetable`} className="menu-item">View Timetable</Link>
                <Link to={`/parent/child/${studentId}/grades`} className="menu-item">View Grades</Link>
                <Link to={`/parent/child/${studentId}/attendance`} className="menu-item">View Attendance</Link>
            </div>
        </div>
    );
};

export default ChildSelection;