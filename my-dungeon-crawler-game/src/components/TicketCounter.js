import React from 'react';

const TicketCounter = ({ tickets }) => {
    return (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h3>Your Tickets</h3>
            <ul>
                {tickets.map((count, index) => (
                    <li key={index}>
                        Answer {index + 1}: {count} tickets
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TicketCounter;
