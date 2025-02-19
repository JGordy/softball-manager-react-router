import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';

import { Center, SegmentedControl } from '@mantine/core';

import {
    IconBallBaseball,
    IconCalendar,
    IconUserSquareRounded
} from '@tabler/icons-react';

import { useAuth } from '@/contexts/auth/useAuth';

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
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const getInitialValue = () => {
        return location.pathname.toLowerCase().includes("team") ? 'teams' : 'profile';
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
            label: <Label Icon={IconCalendar} text="Events" />,
            value: 'events',
            disabled: true,
        },
    ]

    useEffect(() => {
        setValue(getInitialValue()); // Update value when location changes
    }, [location]);

    const handleNavLinkClick = (newValue) => {
        setValue(newValue);
        if (newValue === 'profile') {
            navigate(`/user/${user.$id}`);
        } else {
            navigate(`/${newValue}`);
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