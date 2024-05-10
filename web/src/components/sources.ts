import { CourseResourceIcon } from "./icons/icons"

export type ValidSources =
    | "course_resource";

type SourceMap = { [key in ValidSources]: any }

const SOURCE_METADATA_MAP: SourceMap = {
    course_resource: {
        icon: CourseResourceIcon,
        displayName: "Course Resource",
    }
}


export function getSourceMetadata(sourceType: ValidSources): any {
    return SOURCE_METADATA_MAP[sourceType];
}