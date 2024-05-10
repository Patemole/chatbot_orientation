import { FiFile } from "react-icons/fi";

interface IconProps {
    size?: number;
    className?: string;
}

export const defaultTailwindCSS = "my-auto flex flex-shrink-0 text-default";
export const defaultTailwindCSSBlue = "my-auto flex flex-shrink-0 text-link";

export const CourseResourceIcon = ({
    size = 16,
    className = defaultTailwindCSSBlue,
}: IconProps) => {
    return <FiFile size={size} className={className} />;
};