import { Auth } from "@/types";

interface EmployeeScreenProps{
    auth?: Auth | null;
}
const EmployeeScreen = ({auth}:EmployeeScreenProps) => {
    return(
        <div className="">Employee screen</div>
    );
}

export default EmployeeScreen;