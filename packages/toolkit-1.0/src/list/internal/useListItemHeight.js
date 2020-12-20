import { useTheme } from "../../theme";

export function useListItemHeight(density = "medium") {
  const { toolkit } = useTheme();
  return toolkit.size.getSize({
    variant: "stackable",
    density
  }).height;
}
