import { ValidSources, getSourceMetadata } from "../sources";

export function SourceIcon({
    sourceType,
    iconSize,
}: {
    sourceType: ValidSources;
    iconSize: number;
}) {
    return getSourceMetadata(sourceType).icon({
        size: iconSize,
    });
}