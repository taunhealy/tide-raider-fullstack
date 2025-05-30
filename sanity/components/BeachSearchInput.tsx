import React, {useState, useEffect} from 'react'
import {Stack, Box, Text, Card, Flex, Button} from '@sanity/ui'
import {SearchIcon} from '@sanity/icons'
import {set, unset} from 'sanity'

// This component will be used to search for beaches and select them
export const BeachSearchInput = (props) => {
  const {onChange, value} = props
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Function to search for beaches
  const searchBeaches = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      // Call your API to search for beaches
      const response = await fetch(`/api/beaches/search?term=${encodeURIComponent(term)}`)
      if (!response.ok) throw new Error('Failed to search beaches')
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Error searching beaches:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      searchBeaches(searchTerm)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])

  // Handle selecting a beach
  const handleSelectBeach = (beach) => {
    onChange(
      set({
        beachId: beach.id,
        beachName: beach.name,
        region: beach.region,
        country: beach.country,
      }),
    )
    setSearchTerm('')
    setSearchResults([])
  }

  // Handle clearing the selection
  const handleClear = () => {
    onChange(unset())
    setSearchTerm('')
  }

  return (
    <Stack space={3}>
      {/* Show selected beach if any */}
      {value && value.beachName && (
        <Card padding={3} radius={2} shadow={1} tone="primary">
          <Flex justify="space-between" align="center">
            <Stack space={2}>
              <Text weight="semibold">{value.beachName}</Text>
              <Text size={1} muted>
                {value.region}, {value.country}
              </Text>
            </Stack>
            <Button text="Clear" onClick={handleClear} mode="ghost" />
          </Flex>
        </Card>
      )}

      {/* Search input */}
      {!value?.beachName && (
        <Box>
          <Flex>
            <Box flex={1} marginRight={2}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a beach..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              />
            </Box>
            <Button
              icon={SearchIcon}
              text="Search"
              onClick={() => searchBeaches(searchTerm)}
              disabled={isLoading}
            />
          </Flex>

          {/* Search results */}
          {searchResults.length > 0 && (
            <Stack space={2} marginTop={3}>
              {searchResults.map((beach) => (
                <Card
                  key={beach.id}
                  padding={3}
                  radius={2}
                  shadow={1}
                  onClick={() => handleSelectBeach(beach)}
                  style={{cursor: 'pointer'}}
                >
                  <Text weight="semibold">{beach.name}</Text>
                  <Text size={1} muted>
                    {beach.region}, {beach.country}
                  </Text>
                </Card>
              ))}
            </Stack>
          )}

          {isLoading && <Text>Searching...</Text>}

          {searchTerm.length >= 2 && !isLoading && searchResults.length === 0 && (
            <Text>No beaches found</Text>
          )}
        </Box>
      )}
    </Stack>
  )
}
