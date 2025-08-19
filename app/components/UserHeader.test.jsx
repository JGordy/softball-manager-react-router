import { render, screen } from '@test-utils';
import UserHeader from './UserHeader';

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useOutletContext: () => ({
        user: {
            firstName: 'John',
            lastName: 'Doe',
        },
        isVerified: true,
    }),
}));

describe('UserHeader', () => {
    it('renders the user\'s first name', () => {
        render(<UserHeader />);
        expect(screen.getByText('Hello, John!')).toBeInTheDocument();
    });
});