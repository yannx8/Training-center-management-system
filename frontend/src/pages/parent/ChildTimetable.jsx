import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosInstance';

const ChildTimetable = () => {
    const { studentId } = useParams();
    const [timetable, setTimetable] = useState([]);

    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                const response = await api.get(`/parent/child/${studentId}/timetable`);
                setTimetable(response.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchTimetable();
    }, [studentId]);

    return (
        <div className="page-container">
            <h1>Child's Timetable</h1>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Course</th>
                        <th>Trainer</th>
                        <th>Room</th>
                    </tr>
                </thead>
                <tbody>
                    {timetable.map((session, i) => (
                        <tr key={i}>
                            <td>{new Date(session.date).toLocaleDateString()}</td>
                            <td>{session.start_time} - {session.end_time}</td>
                            <td>{session.course_name}</td>
                            <td>{session.trainer_name}</td>
                            <td>{session.room_name}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ChildTimetable;
