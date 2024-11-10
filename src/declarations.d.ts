// declarations.d.ts
declare module "*.jsx" {
    import { ComponentType } from "react";
    const content: ComponentType<unknown>;
    export default content;
}
