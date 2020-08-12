import { NgxRootFormComponent } from './ngx-root-form.component';
export declare class DataInputUsedOnWrongPropertyError extends Error {
    constructor(calledOnPropertyKey: string);
}
export declare function DataInput(): <ControlInterface, FormInterface = ControlInterface>(target: NgxRootFormComponent<ControlInterface, FormInterface>, propertyKey: string) => void;
