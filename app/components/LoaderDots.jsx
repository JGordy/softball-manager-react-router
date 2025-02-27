import { Container, Flex, Loader, Text } from '@mantine/core';

export default function LoaderDots({ message }) {
    return (
        <Container h="100vh">
            <Flex direction="column" justify="center" align="center" h="100vh">
                <Loader color="green" type="dots" size={50} />
                {message && <Text>{message}</Text>}
            </Flex>
        </Container>
    );
}