import { Button, IconButton, Tooltip } from "@mui/material";
import { Box, styled } from "@mui/system";
import { useEffect, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { getLocalImages } from "./utils/DockerUtils";
import { createDockerDesktopClient } from '@docker/extension-api-client';
import { useTheme } from '@mui/material';
import { IDockerImage, ISelectedImage } from "./models/IDockerImage";
import { RefreshRounded } from "@mui/icons-material";
import { toast } from "./utils/UIUtils";

interface ImageSelectorProps {
  onDeployClick?: (image: ISelectedImage) => void;
}

interface ImageOption {
  readonly value: string;
  readonly label: string;
}

export function ImageSelector(props?: ImageSelectorProps) {
  const onDeployClick = props?.onDeployClick;
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<Map<string, IDockerImage>>(new Map());
  const [imageOptions, setImageOptions] = useState<ImageOption[]>([]);
  const [selectedImage, setSelectedImage] = useState<ISelectedImage | null>(null);

  async function loadImages(): Promise<void> {
    const refreshing = !initialLoading;
    const localImages = await getLocalImages();
    setInitialLoading(false);
    const sortedKeys = Array.from(localImages.keys()).sort();

    const options = sortedKeys.map(d => ({
      value: d,
      label: d
    } as ImageOption));
    setLoading(false);
    setImages(localImages);
    setImageOptions(options);
    if (refreshing) {
      toast.success('Reloaded image list');
    }
    return;
  }

  useEffect(() => {
    if (loading) {
      loadImages();
    }
  }, [loading]);

  const handleRefresh = () => {
    setSelectedImage(null);
    setLoading(true);
  }

  const deploy = (): void => {
    if (selectedImage && onDeployClick) {
      onDeployClick(selectedImage);
    }
  }

  function handleSelection(imageOption: SingleValue<ImageOption>) {
    console.log(`Selected image: ${imageOption?.value}`);
    const name = imageOption?.value;
    if (name) {
      const image = images.get(name);
      if (image) {
        setSelectedImage({ name, image });
      }
    }
  }
  const dockerTheme = useTheme();
  return (
    <Box margin="15px 0px 15px 0px" display="flex" flexDirection="row">
      <div style={{ flex: '1 1 auto' }}>
        <Select
          noOptionsMessage={() => "No images found"}
          placeholder="Select an image to deploy"
          isClearable
          isSearchable
          options={imageOptions}
          onChange={handleSelection}
          value={imageOptions.filter(image => image.value === selectedImage?.name)}
          theme={(theme) => ({
            ...theme,
            colors: {
              ...theme.colors,
              // primary: 'hotpink' // selected input border color
              primary25: dockerTheme.palette.primary.light, // option highlight color
              // primary50: 'hotpink' // unknown
              // primary75: 'hotpink' //unknown 
              neutral0: dockerTheme.palette.background.default, // background
              // neutral5: 'hotpink',
              // neutral10: 'green',
              // neutral20: 'yellow', // inactive input field border
              // neutral30: 'blue',
              // neutral40: 'hotpink', // mouse hoover over x to clean filter and combo button \/ icon
              neutral50: dockerTheme.palette.text.secondary, // input field placeholder text
              // neutral60: 'yellow', // selected combo x and \/ icon colors
              // neutral70: 'hotpink' // unknown
              neutral80: dockerTheme.palette.text.secondary, // text color for selectd value in input field
              // neutral90: 'yellow', // unknown
              // danger: 'hotpink' // unknown
            },
          })}
        />
      </div>
      <Tooltip title="Reload the list of local Docker images">
        <span>
          <Button variant="outlined" onClick={handleRefresh} style={{ marginLeft: '20px' }} disabled={loading}>
            <RefreshRounded /> Reload
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Deploy the selected image to OpenShift">
        <span>
          <Button style={{ marginLeft: '20px' }} variant="contained" onClick={deploy} disabled={!selectedImage}> Deploy </Button>
        </span>
      </Tooltip>
    </Box >
  );
}