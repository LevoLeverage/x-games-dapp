import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faFileSignature } from '@fortawesome/free-solid-svg-icons';

const CountdownTimer = ({ endTime }) => {
    const calculateTimeLeft = useCallback(() => {
        const difference = new Date(endTime) - new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }

        return timeLeft;
    }, [endTime]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    const timerComponents = [];

    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval]) {
            return;
        }

        timerComponents.push(
            <span key={interval}>
                {timeLeft[interval]} {interval}{" "}
            </span>
        );
    });

    return (
        <div className="CountdownTimer">
            <h3> <FontAwesomeIcon icon={faClock} /> Round ends in:</h3>
            {timerComponents.length ? timerComponents : <span>Round is over! You will receive your rewards automatically. Stay tuned for the next round!</span>}
            <p className="spacing-ct"></p> {/* Empty paragraph for spacing */}
            <h3> <FontAwesomeIcon icon={faFileSignature} /> Rules:</h3>
            <p>1. You can buy multiple tickets.</p>
            <p>2. Each ticket costs 0.00001 ETH.</p>
            <p>3. The answer with the most tickets wins.</p>
            <p>4. Rewards will be distributed to the winners automatically.</p>
        </div>
    );
};

export default CountdownTimer;