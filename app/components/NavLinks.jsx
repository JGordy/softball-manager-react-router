import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';

import { Center, SegmentedControl } from '@mantine/core';

import {
    IconBallBaseball,
    IconCalendar,
    IconUserSquareRounded
} from '@tabler/icons-react';

import classes from '@/styles/navLinks.module.css';

function Label({ Icon, text }) {
    return (
        <Center style={{ gap: 10 }}>
            <Icon size={24} />
            <span>{text}</span>
        </Center>
    );
}

function NavLinks() {
    const navigate = useNavigate();
    const { userId } = useParams();
    const location = useLocation();

    const getInitialValue = () => {
        const pathParts = location.pathname.split('/');
        return pathParts.includes('teams') ? 'teams' : 'profile';
    };

    const [value, setValue] = useState(getInitialValue());

    const links = [
        {
            label: <Label Icon={IconUserSquareRounded} text="Profile" />,
            value: 'profile'

        },
        {
            label: <Label Icon={IconBallBaseball} text="Teams" />,
            value: 'teams'

        },
        {
            label: <Label Icon={IconCalendar} text="Schedule" />,
            value: 'schedule',
            disabled: true,
        },
    ]

    useEffect(() => {
        setValue(getInitialValue()); // Update value when location changes
    }, [location]); // Add location as a dependency

    const handleNavLinkClick = (newValue) => {
        setValue(newValue);
        let href = `/user/${userId}`;
        if (newValue === 'profile') {
            navigate(href);
        } else {
            navigate(`${href}/${newValue}`);
        }
    };

    return (
        <div className={classes.navLinksContainer}>
            <SegmentedControl
                className={classes.navLinks}
                color="green"
                data={links}
                fullWidth
                onChange={handleNavLinkClick}
                size="md"
                radius="xl"
                value={value}
                transitionDuration={500}
                transitionTimingFunction="linear"
                withItemsBorders={false}
            />
        </div>
    );
}

export default NavLinks;