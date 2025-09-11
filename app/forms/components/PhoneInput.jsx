import { Input } from "@mantine/core";

import { IMaskInput } from "react-imask";

import classes from "@/styles/inputs.module.css";

export default function PhoneInput({ defaultValue }) {
    return (
        <Input.Wrapper className={classes.inputs}>
            <Input.Label>Phone Number</Input.Label>
            <Input
                defaultValue={defaultValue}
                component={IMaskInput}
                label="Phone Number"
                mask="(000) 000-0000"
                name="phoneNumber"
                placeholder="(xxx) xxx-xxxx"
            />
        </Input.Wrapper>
    );
}
