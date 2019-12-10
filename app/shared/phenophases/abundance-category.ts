import {AbundanceValue} from "./abundance-value";

export class AbundanceCategory {
    abundance_category_id: number;
    name: string;
    description: string;
    deleted: boolean;
    abundanceValues: AbundanceValue[];
}