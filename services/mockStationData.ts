/**
 * Mock Station Data Service
 * Provides mock MTA station data for development and demo purposes
 */

import { StationInfo, Coordinates } from '@/types/station';

// Named coordinates for stations and stops
const COORD_TIMES_SQ_42: Coordinates = { lat: 40.7549, lng: -73.9872 };
const COORD_CENTRAL_PARK_59: Coordinates = { lat: 40.7681, lng: -73.9819 };
const COORD_BROOKLYN_BRIDGE_CITY_HALL: Coordinates = { lat: 40.7127, lng: -74.0059 };
const COORD_14TH_ST_UNION_SQ: Coordinates = { lat: 40.7348, lng: -73.9897 };
const COORD_14TH_ST_1ST_AV_BUS: Coordinates = { lat: 40.7323, lng: -73.986 };

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in meters
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function generateMockStations(userLocation?: Coordinates): StationInfo[] {
  return [
    {
      id: 'times-sq-42',
      name: 'Times Sq-42nd St',
      type: 'subway',
      borough: 'Manhattan',
      lines: ['1', '2', '3', '7', 'N', 'Q', 'R', 'W', 'S'],
      coordinates: COORD_TIMES_SQ_42,
      distance: userLocation ? calculateDistance(userLocation, COORD_TIMES_SQ_42) : undefined,
      accessibility: {
        wheelchairAccessible: true,
        elevators: ['Street to mezzanine', 'Mezzanine to platform'],
        escalators: true,
        visualAids: ['Tactile warning strips', 'High contrast signs'],
        audioAids: ['Audio announcements', 'Talking directions'],
      },
      kidFriendlyInfo: {
        nickname: 'The Heart of NYC',
        whatToSee: [
          'Bright lights everywhere',
          'Street performers',
          'Red Steps',
          'TKTS booth',
          'Costume characters',
        ],
        tip: 'This is one of the busiest stations in the world - hold hands tight and stay close!',
        funFact:
          "Over 200,000 people pass through this station every day - that's like a whole city!",
        safetyNote: 'Very crowded - always stay with your adult and watch for moving crowds',
      },
      exits: [
        {
          name: '7th Av & 42nd St',
          description: 'Main Times Square exit with red steps',
          isAccessible: true,
        },
        {
          name: 'Broadway & 42nd St',
          description: 'Theater District exit near TKTS',
          isAccessible: true,
        },
        {
          name: '8th Av & 42nd St',
          description: 'Port Authority Bus Terminal exit',
          isAccessible: false,
        },
      ],
      amenities: ['Police station', 'Information booth', 'Restrooms', 'Food vendors'],
      nearbyAttractions: [
        'Times Square',
        'Broadway theaters',
        'M&M Store',
        "Hershey's Chocolate World",
      ],
    },
    {
      id: 'central-park-59',
      name: '59th St-Columbus Circle',
      type: 'subway',
      borough: 'Manhattan',
      lines: ['A', 'B', 'C', 'D', '1'],
      coordinates: COORD_CENTRAL_PARK_59,
      distance: userLocation ? calculateDistance(userLocation, COORD_CENTRAL_PARK_59) : undefined,
      accessibility: {
        wheelchairAccessible: true,
        elevators: ['Street to mezzanine elevator', 'Platform elevator'],
        escalators: true,
        visualAids: ['Braille signs', 'Tactile guidance'],
        audioAids: ['Platform announcements'],
      },
      kidFriendlyInfo: {
        nickname: 'Gateway to Central Park',
        whatToSee: [
          'Central Park entrance',
          'Columbus statue',
          'Horse carriages',
          'Street artists',
        ],
        tip: 'Perfect place to start exploring Central Park - the entrance is right outside!',
        funFact: 'The station is at the exact corner where Central Park begins!',
        safetyNote: 'Watch for horse carriages and bikes near the park entrance',
      },
      exits: [
        {
          name: 'Central Park South',
          description: 'Direct entrance to Central Park',
          isAccessible: true,
        },
        {
          name: 'Columbus Circle',
          description: 'Shopping center and restaurants',
          isAccessible: true,
        },
      ],
      amenities: ['Tourist information', 'Bike rental nearby', 'Food court access'],
      nearbyAttractions: ['Central Park', 'Time Warner Center', 'Lincoln Center', 'Apple Store'],
    },
    {
      id: 'brooklyn-bridge-city-hall',
      name: 'Brooklyn Bridge-City Hall',
      type: 'subway',
      borough: 'Manhattan',
      lines: ['4', '5', '6'],
      coordinates: COORD_BROOKLYN_BRIDGE_CITY_HALL,
      distance: userLocation
        ? calculateDistance(userLocation, COORD_BROOKLYN_BRIDGE_CITY_HALL)
        : undefined,
      accessibility: {
        wheelchairAccessible: false,
        elevators: [],
        escalators: false,
        visualAids: ['Some tactile strips'],
        audioAids: ['Basic announcements'],
      },
      kidFriendlyInfo: {
        nickname: 'Gateway to the Famous Bridge',
        whatToSee: ['Bridge entrance', 'Historic buildings', 'City Hall park', 'Old architecture'],
        tip: 'This station is old and has lots of stairs - perfect for seeing the famous Brooklyn Bridge!',
        funFact: 'This is one of the original subway stations from 1904!',
        safetyNote: 'Lots of stairs and no elevators - not good for strollers or wheelchairs',
      },
      exits: [
        {
          name: 'Park Row',
          description: 'Brooklyn Bridge pedestrian entrance',
          isAccessible: false,
        },
        {
          name: 'Centre St',
          description: 'City Hall and government buildings',
          isAccessible: false,
        },
      ],
      amenities: ['Historic tile work', 'Tourist signs'],
      nearbyAttractions: [
        'Brooklyn Bridge',
        'South Street Seaport',
        'Stone Street',
        '9/11 Memorial',
      ],
    },
    {
      id: '14th-st-union-sq',
      name: '14th St-Union Sq',
      type: 'subway',
      borough: 'Manhattan',
      lines: ['4', '5', '6', 'L', 'N', 'Q', 'R', 'W'],
      coordinates: COORD_14TH_ST_UNION_SQ,
      distance: userLocation ? calculateDistance(userLocation, COORD_14TH_ST_UNION_SQ) : undefined,
      accessibility: {
        wheelchairAccessible: true,
        elevators: ['Main elevator to all levels', 'Platform elevators'],
        escalators: true,
        visualAids: ['Full tactile guidance', 'Braille maps'],
        audioAids: ['Comprehensive audio system'],
      },
      kidFriendlyInfo: {
        nickname: 'The Big Transfer Station',
        whatToSee: ['Union Square Park', 'Farmers market', 'Street performers', 'Statues'],
        tip: 'Great place to transfer between trains and see lots of different people!',
        funFact: "8 different subway lines meet here - it's like a train crossroads!",
        safetyNote: 'Very busy transfer station - follow the signs carefully',
      },
      exits: [
        {
          name: 'Union Square Park',
          description: 'Main park entrance with farmers market',
          isAccessible: true,
        },
        { name: '14th St & Broadway', description: 'Shopping and restaurants', isAccessible: true },
        { name: '4th Ave', description: 'Quieter residential side', isAccessible: false },
      ],
      amenities: ['Large transfer area', 'Information booth', 'Emergency assistance'],
      nearbyAttractions: ['Union Square Park', 'Strand Bookstore', 'Whole Foods', 'Comedy clubs'],
    },
    {
      id: '14th-st-1st-av-bus',
      name: '14th St/1st Av',
      type: 'bus',
      borough: 'Manhattan',
      lines: ['M15'],
      coordinates: COORD_14TH_ST_1ST_AV_BUS,
      distance: userLocation
        ? calculateDistance(userLocation, COORD_14TH_ST_1ST_AV_BUS)
        : undefined,
      accessibility: {
        wheelchairAccessible: true,
        elevators: [],
        escalators: false,
        visualAids: ['Audio announcements at stop'],
        audioAids: ['Bus arrival announcements'],
      },
      kidFriendlyInfo: {
        nickname: 'The Select Bus Stop',
        whatToSee: ['Busy street life', 'Local shops', 'People from all walks of life'],
        tip: 'This is a Select Bus stop - remember to pay at the machine before the bus comes!',
        funFact: 'Select buses have their own special lanes to avoid traffic!',
        safetyNote: 'Stay behind the yellow line and watch for bikes in the bike lane',
      },
      exits: [
        {
          name: '1st Avenue',
          description: 'Main avenue with shops and restaurants',
          isAccessible: true,
        },
      ],
      amenities: ['SBS fare machines', 'Real-time arrival displays', 'Shelter'],
      nearbyAttractions: ['Stuyvesant Square', 'Local markets', 'Community gardens'],
    },
  ];
}
