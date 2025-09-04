import { Button, Checkbox, CheckboxGroup, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, Flex, FormLabel, RangeSlider, RangeSliderFilledTrack, RangeSliderThumb, RangeSliderTrack, Select, Stack, VStack, Box, Text } from '@chakra-ui/react';
import { useState } from 'react';

interface CourseFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CourseFilterModal = ({ isOpen, onClose }: CourseFilterModalProps) => {
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [duration, setDuration] = useState('');
  const [sortBy, setSortBy] = useState('');

  const levels = [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ];

  const categories = [
    { id: 'web', label: 'Web Development' },
    { id: 'mobile', label: 'Mobile Development' },
    { id: 'data-science', label: 'Data Science' },
    { id: 'design', label: 'UI/UX Design' },
    { id: 'business', label: 'Business' },
    { id: 'marketing', label: 'Marketing' },
  ];

  const handleApplyFilters = () => {
    // In a real app, you would update the query params or state with the selected filters
    console.log({
      priceRange,
      selectedLevels,
      selectedCategories,
      duration,
      sortBy,
    });
    
    onClose();
  };

  const handleReset = () => {
    setPriceRange([0, 500]);
    setSelectedLevels([]);
    setSelectedCategories([]);
    setDuration('');
    setSortBy('');
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Filter Courses</DrawerHeader>

        <DrawerBody>
          <VStack spacing={6} align="stretch">
            {/* Price Range */}
            <Box>
              <FormLabel mb={4} fontWeight="medium">Price Range</FormLabel>
              <Box px={4}>
                <RangeSlider
                  aria-label={['min', 'max']}
                  defaultValue={[0, 500]}
                  min={0}
                  max={500}
                  step={10}
                  onChange={(val) => setPriceRange(val)}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack bg="blue.500" />
                  </RangeSliderTrack>
                  <RangeSliderThumb boxSize={5} index={0} />
                  <RangeSliderThumb boxSize={5} index={1} />
                </RangeSlider>
                <Flex justify="space-between" mt={2}>
                  <Text>${priceRange[0]}</Text>
                  <Text>${priceRange[1]}+</Text>
                </Flex>
              </Box>
            </Box>

            {/* Levels */}
            <Box>
              <FormLabel mb={3} fontWeight="medium">Level</FormLabel>
              <CheckboxGroup
                value={selectedLevels}
                onChange={(value) => setSelectedLevels(value as string[])}
              >
                <Stack spacing={2}>
                  {levels.map((level) => (
                    <Checkbox key={level.id} value={level.id}>
                      {level.label}
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </Box>

            {/* Categories */}
            <Box>
              <FormLabel mb={3} fontWeight="medium">Categories</FormLabel>
              <CheckboxGroup
                value={selectedCategories}
                onChange={(value) => setSelectedCategories(value as string[])}
              >
                <Stack spacing={2} maxH="200px" overflowY="auto" pr={2}>
                  {categories.map((category) => (
                    <Checkbox key={category.id} value={category.id}>
                      {category.label}
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </Box>

            {/* Duration */}
            <Box>
              <FormLabel mb={2} fontWeight="medium">Duration</FormLabel>
              <Select
                placeholder="Select duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="0-2">0-2 hours</option>
                <option value="2-5">2-5 hours</option>
                <option value="5-10">5-10 hours</option>
                <option value="10+">10+ hours</option>
              </Select>
            </Box>

            {/* Sort By */}
            <Box>
              <FormLabel mb={2} fontWeight="medium">Sort By</FormLabel>
              <Select
                placeholder="Default sorting"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </Select>
            </Box>
          </VStack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px">
          <Flex justify="space-between" w="full">
            <Button variant="outline" onClick={handleReset}>
              Reset All
            </Button>
            <Button colorScheme="blue" onClick={handleApplyFilters} ml={3}>
              Apply Filters
            </Button>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export { CourseFilterModal as default };
