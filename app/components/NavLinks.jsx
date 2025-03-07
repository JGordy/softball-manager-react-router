import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';

import { Center, SegmentedControl } from '@mantine/core';

// import {
//     IconBallBaseball,
//     IconCalendar,
//     IconHome,
//     IconUserSquareRounded
// } from '@tabler/icons-react';

import { useAuth } from '@/contexts/auth/useAuth';

import classes from '@/styles/navlinks.module.css';

// function Label({ Icon, text }) {
//     return (
//         <Center style={{ gap: 10 }}>
//             <Icon size={24} />
//             <span>{text}</span>
//         </Center>
//     );
// }

function NavLinks() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const getInitialValue = () => {
        const keywords = ["team", "game", "season"];
        if (keywords.some(keyword => location.pathname.toLowerCase().includes(keyword))) {
            return 'teams';
        };

        if (location.pathname.toLowerCase().includes('user')) {
            return 'user';
        }

        if (location.pathname.toLowerCase().includes('events')) {
            return 'events';
        }

        return 'home';
    };

    const [value, setValue] = useState(getInitialValue());

    const links = [
        {
            // label: <Label Icon={IconHome} text={(value === 'home') && "Home"} />,
            value: 'home'

        },
        {
            // label: <Label Icon={IconBallBaseball} text={(value === 'teams') && "Teams"} />,
            value: 'teams'
        },
        {
            // label: <Label Icon={IconCalendar} text={(value === 'events') && "Events"} />,
            value: 'events',
        },
        {
            // label: <Label Icon={IconUserSquareRounded} text={(value === 'user') && "Profile"} />,
            value: 'user'

        },
    ]

    useEffect(() => {
        setValue(getInitialValue()); // Update value when location changes
    }, [location]);

    const handleNavLinkClick = (newValue) => {
        setValue(newValue);

        if (newValue === 'user') {
            navigate(`/user/${user.$id}`);
        } else if (newValue === 'home') {
            navigate('/');
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