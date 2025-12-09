import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  ZoomIn,
  ZoomOut,
  Navigation,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Plus,
  Filter,
  Search,
  Download,
  Layers,
  Building,
  ChevronRight,
  Menu,
  Info,
  User,
  Grid,
  Ruler,
  Loader2
} from 'lucide-react';

// Updated color palette to match ColorPalette.png
const BLUEPRINT_BG = '#0B1220'; // Dark blue background
const BLUEPRINT_PAPER = '#F8FBFD'; // Light blue paper
const BLUEPRINT_LINE = '#0A0A0A'; // Black lines for blueprint
const BLUEPRINT_LABEL = '#1E3A8A'; // Navy blue labels
const BLUEPRINT_TEXT = '#374151'; // Gray text
const BLUEPRINT_GRID = '#3B82F6'; // Blue grid lines
const BLUEPRINT_HALLWAY = '#DBEAFE'; // Light blue for hallways
const BLUEPRINT_STAIRS = '#BFDBFE'; // Lighter blue for stairs
const BLUEPRINT_CR = '#E0F2FE'; // Very light blue for CR

// Status colors updated to match dashboard
const statusColors = {
  pending: '#FFD700', // Yellow
  in_progress: '#FF8C00', // Orange
  completed: '#4CAF50', // Green
  no_request: '#E5E7EB' // Light gray
};

const statusIcons = {
  pending: <Clock className="w-4 h-4" />,
  in_progress: <AlertCircle className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
  no_request: null
};

// Function to create blueprint grid pattern
const createBlueprintGrid = (width, height) => {
  const gridSize = 20;
  const gridLines = [];
  
  // Main grid lines
  for (let x = 0; x <= width; x += gridSize) {
    gridLines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke={BLUEPRINT_GRID}
        strokeWidth="0.5"
        strokeOpacity="0.1"
      />
    );
  }
  
  for (let y = 0; y <= height; y += gridSize) {
    gridLines.push(
      <line
        key={`h-${y}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke={BLUEPRINT_GRID}
        strokeWidth="0.5"
        strokeOpacity="0.1"
      />
    );
  }
  
  // Thicker guide lines every 100 units
  for (let x = 0; x <= width; x += 100) {
    gridLines.push(
      <line
        key={`guide-v-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke={BLUEPRINT_GRID}
        strokeWidth="1"
        strokeOpacity="0.2"
        strokeDasharray="5,5"
      />
    );
  }
  
  for (let y = 0; y <= height; y += 100) {
    gridLines.push(
      <line
        key={`guide-h-${y}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke={BLUEPRINT_GRID}
        strokeWidth="1"
        strokeOpacity="0.2"
        strokeDasharray="5,5"
      />
    );
  }
  
  return gridLines;
};

// Function to create blueprint paper background with subtle texture
const createBlueprintPaper = (width, height) => {
  const patternId = 'blueprint-pattern';
  
  return (
    <defs>
      <pattern
        id={patternId}
        width="200"
        height="200"
        patternUnits="userSpaceOnUse"
      >
        <rect width="200" height="200" fill="#F8FBFD" />
        {/* Subtle diagonal lines for blueprint texture */}
        <line
          x1="0"
          y1="200"
          x2="200"
          y2="0"
          stroke="#E0F2FE"
          strokeWidth="0.3"
          strokeOpacity="0.2"
        />
        <line
          x1="0"
          y1="0"
          x2="200"
          y2="200"
          stroke="#E0F2FE"
          strokeWidth="0.3"
          strokeOpacity="0.2"
        />
      </pattern>
    </defs>
  );
};

const getDefaultRoomsForFloor = (building, floor) => {
  const createRoom = (id, room_number, room_name, x, y, width, height, status = 'no_request', request_count = 0, special = null) => ({
    id, room_number, room_name, x, y, width, height, status, request_count, special
  });

  const layouts = {
  'NEW BUILDING': {
    'GROUND FLOOR': () => {
      const rooms = [];
      const startX = 40;
      const startY = 40;
      const roomWidth = 140;
      const roomHeight = 100;
      const hallwayHeight = 60;
      const stairsWidth = roomWidth;
      const stairsHeight = 80;
      const crWidth = 70;
      const crHeight = 60;
      const gap = 20;

      rooms.push(createRoom('STAIRS_LEFT', 'STAIRS', 'Stairs', startX, startY, 80, 120, 'no_request', 0, 'stairs'));

      const crMaleX = startX + 80 + gap;
      rooms.push(createRoom('CR_MALE_GF', 'CR M', 'Male CR', crMaleX, startY, crWidth, crHeight, 'no_request', 0));

      const nb1X = crMaleX + crWidth + gap;
      rooms.push(createRoom('NB1', 'NB1', 'Room NB1', nb1X, startY, roomWidth, roomHeight, 'pending', 2));

      const hallwayStartX = startX;
      const hallwayEndX = nb1X + roomWidth;
      const hallwayWidth = hallwayEndX - hallwayStartX;
      const firstHallwayY = startY + 120 + gap/2;
      rooms.push(createRoom('HALLWAY_TOP', 'HALL', 'Hallway', hallwayStartX, firstHallwayY, hallwayWidth, hallwayHeight, 'no_request', 0, 'hallway'));

      const nb2X = nb1X + roomWidth + gap;
      rooms.push(createRoom('NB2', 'NB2', 'Room NB2', nb2X, startY, roomWidth, roomHeight, 'no_request', 0));

      const nb3Y = startY + roomHeight + gap;
      rooms.push(createRoom('NB3', 'NB3', 'Room NB3', nb2X, nb3Y, roomWidth, roomHeight, 'completed', 1));

      const extraGap = 60;
      const crFemaleX = nb2X + extraGap;
      const nb3Bottom = nb3Y + roomHeight;
      rooms.push(createRoom('CR_FEMALE_GF', 'CR F', 'Female CR', crFemaleX, nb3Bottom + gap, crWidth, crHeight, 'no_request', 0));

      const crBottom = nb3Bottom + gap + crHeight;
      const stairsRightX = nb2X;
      rooms.push(createRoom('STAIRS_RIGHT', 'STAIRS', 'Stairs', stairsRightX, crBottom + gap, stairsWidth, stairsHeight, 'no_request', 0, 'stairs'));

      const secondHallwayWidth = crWidth;
      const topHallwayRightX = hallwayStartX + hallwayWidth;
      const secondHallwayX = topHallwayRightX - 80;
      
      const crFemaleTop = nb3Bottom + gap;
      const stairsRightBottom = crBottom + gap + stairsHeight;
      const secondHallwayHeight = stairsRightBottom - crFemaleTop;
      
      rooms.push(createRoom('HALLWAY_LEFT_SIDE', 'HALL', 'Hallway', secondHallwayX, crFemaleTop, secondHallwayWidth, secondHallwayHeight, 'no_request', 0, 'hallway'));

      const canvasWidth = Math.max(
        nb2X + roomWidth + gap*2,
        crFemaleX + crWidth + gap
      );
      const canvasHeight = Math.max(
        firstHallwayY + hallwayHeight + gap,
        crBottom + gap + stairsHeight + gap*2
      );

      return { rooms, canvasWidth, canvasHeight };
    },
    '2ND FLOOR': () => {
      const rooms = [];
      const startX = 40;
      const startY = 40;
      const roomWidth = 140;
      const roomHeight = 100;
      const hallwayHeight = 60;
      const stairsWidth = roomWidth;
      const stairsHeight = 80;
      const crWidth = 70;
      const crHeight = 60;
      const gap = 20;

      rooms.push(createRoom('STAIRS_LEFT_2F', 'STAIRS', 'Stairs', startX, startY, 80, 120, 'no_request', 0, 'stairs'));

      const crMaleX = startX + 80 + gap;
      rooms.push(createRoom('CR_MALE_2F', 'CR M', 'Male CR', crMaleX, startY, crWidth, crHeight, 'no_request', 0));

      const nb4X = crMaleX + crWidth + gap;
      rooms.push(createRoom('NB4', 'NB4', 'Room NB4', nb4X, startY, roomWidth, roomHeight, 'pending', 1));

      const hallwayStartX = startX;
      const hallwayEndX = nb4X + roomWidth;
      const hallwayWidth = hallwayEndX - hallwayStartX;
      const firstHallwayY = startY + 120 + gap/2;
      rooms.push(createRoom('HALLWAY_TOP_2F', 'HALL', 'Hallway', hallwayStartX, firstHallwayY, hallwayWidth, hallwayHeight, 'no_request', 0, 'hallway'));

      const nb5X = nb4X + roomWidth + gap;
      rooms.push(createRoom('NB5', 'NB5', 'Room NB5', nb5X, startY, roomWidth, roomHeight, 'in_progress', 2));

      const nb6Y = startY + roomHeight + gap;
      rooms.push(createRoom('NB6', 'NB6', 'Room NB6', nb5X, nb6Y, roomWidth, roomHeight, 'no_request', 0));

      const extraGap = 60;
      const crFemaleX = nb5X + extraGap;
      const nb6Bottom = nb6Y + roomHeight;
      rooms.push(createRoom('CR_FEMALE_2F', 'CR F', 'Female CR', crFemaleX, nb6Bottom + gap, crWidth, crHeight, 'no_request', 0));

      const crBottom = nb6Bottom + gap + crHeight;
      const stairsRightX = nb5X;
      rooms.push(createRoom('STAIRS_RIGHT_2F', 'STAIRS', 'Stairs', stairsRightX, crBottom + gap, stairsWidth, stairsHeight, 'no_request', 0, 'stairs'));

      const secondHallwayWidth = crWidth;
      const topHallwayRightX = hallwayStartX + hallwayWidth;
      const secondHallwayX = topHallwayRightX - 80;
      
      const crFemaleTop = nb6Bottom + gap;
      const stairsRightBottom = crBottom + gap + stairsHeight;
      const secondHallwayHeight = stairsRightBottom - crFemaleTop;
      
      rooms.push(createRoom('HALLWAY_LEFT_SIDE_2F', 'HALL', 'Hallway', secondHallwayX, crFemaleTop, secondHallwayWidth, secondHallwayHeight, 'no_request', 0, 'hallway'));

      const canvasWidth = Math.max(
        nb5X + roomWidth + gap*2,
        crFemaleX + crWidth + gap
      );
      const canvasHeight = Math.max(
        firstHallwayY + hallwayHeight + gap,
        crBottom + gap + stairsHeight + gap*2
      );

      return { rooms, canvasWidth, canvasHeight };
    },
    '3RD FLOOR': () => {
      const rooms = [];
      const startX = 40;
      const startY = 40;
      const roomWidth = 140;
      const roomHeight = 100;
      const hallwayHeight = 60;
      const stairsWidth = roomWidth;
      const stairsHeight = 80;
      const crWidth = 70;
      const crHeight = 60;
      const gap = 20;

      rooms.push(createRoom('STAIRS_LEFT_3F', 'STAIRS', 'Stairs', startX, startY, 80, 120, 'no_request', 0, 'stairs'));

      const crMaleX = startX + 80 + gap;
      rooms.push(createRoom('CR_MALE_3F', 'CR M', 'Male CR', crMaleX, startY, crWidth, crHeight, 'no_request', 0));

      const nb7X = crMaleX + crWidth + gap;
      rooms.push(createRoom('NB7', 'NB7', 'Room NB7', nb7X, startY, roomWidth, roomHeight, 'completed', 1));

      const hallwayStartX = startX;
      const hallwayEndX = nb7X + roomWidth;
      const hallwayWidth = hallwayEndX - hallwayStartX;
      const firstHallwayY = startY + 120 + gap/2;
      rooms.push(createRoom('HALLWAY_TOP_3F', 'HALL', 'Hallway', hallwayStartX, firstHallwayY, hallwayWidth, hallwayHeight, 'no_request', 0, 'hallway'));

      const nb8X = nb7X + roomWidth + gap;
      rooms.push(createRoom('NB8', 'NB8', 'Room NB8', nb8X, startY, roomWidth, roomHeight, 'pending', 1));

      const nb9Y = startY + roomHeight + gap;
      rooms.push(createRoom('NB9', 'NB9', 'Room NB9', nb8X, nb9Y, roomWidth, roomHeight, 'in_progress', 1));

      const extraGap = 60;
      const crFemaleX = nb8X + extraGap;
      const nb9Bottom = nb9Y + roomHeight;
      rooms.push(createRoom('CR_FEMALE_3F', 'CR F', 'Female CR', crFemaleX, nb9Bottom + gap, crWidth, crHeight, 'no_request', 0));

      const crBottom = nb9Bottom + gap + crHeight;
      const stairsRightX = nb8X;
      rooms.push(createRoom('STAIRS_RIGHT_3F', 'STAIRS', 'Stairs', stairsRightX, crBottom + gap, stairsWidth, stairsHeight, 'no_request', 0, 'stairs'));

      const secondHallwayWidth = crWidth;
      const topHallwayRightX = hallwayStartX + hallwayWidth;
      const secondHallwayX = topHallwayRightX - 80;
      
      const crFemaleTop = nb9Bottom + gap;
      const stairsRightBottom = crBottom + gap + stairsHeight;
      const secondHallwayHeight = stairsRightBottom - crFemaleTop;
      
      rooms.push(createRoom('HALLWAY_LEFT_SIDE_3F', 'HALL', 'Hallway', secondHallwayX, crFemaleTop, secondHallwayWidth, secondHallwayHeight, 'no_request', 0, 'hallway'));

      const canvasWidth = Math.max(
        nb8X + roomWidth + gap*2,
        crFemaleX + crWidth + gap
      );
      const canvasHeight = Math.max(
        firstHallwayY + hallwayHeight + gap,
        crBottom + gap + stairsHeight + gap*2
      );

      return { rooms, canvasWidth, canvasHeight };
    }
  },
    'DFA BUILDING': {
      '2ND FLOOR': () => {
        const rooms = [];
        const startX = 50;
        const startY = 50;
        
        const aWidth = 80;
        const aHeight = 80;
        const stairsWidth = 220;
        const hallwayHeight = 100;
        const officeWidth = 100;
        const officeHeight = 80;
        const dllWidth = 90;
        const dllHeight = 80;
        
        const gap = 15;

        const topRooms = [
          { id: 'STAIRS_TOP', number: 'STAIRS', name: 'Stairs', status: 'no_request', requests: 0, special: 'stairs', width: stairsWidth },
          { id: 'A12', number: 'A12', name: 'Room A12', status: 'completed', requests: 1, width: aWidth },
          { id: 'A10', number: 'A10', name: 'Room A10', status: 'no_request', requests: 0, width: aWidth },
          { id: 'A8', number: 'A8', name: 'Room A8', status: 'no_request', requests: 0, width: aWidth },
          { id: 'A6', number: 'A6', name: 'Room A6', status: 'no_request', requests: 0, width: aWidth },
          { id: 'A4', number: 'A4', name: 'Room A4', status: 'pending', requests: 1, width: aWidth },
          { id: 'A2', number: 'A2', name: 'Room A2', status: 'completed', requests: 1, width: aWidth },
          { id: 'DLL_MUSIC_ARTS', number: 'DLL', name: 'DLL Music & Arts', status: 'completed', requests: 1, width: dllWidth, offsetX: 50}
        ];

        let currentX = startX;
        topRooms.forEach(room => {
          rooms.push(createRoom(
            room.id,
            room.number,
            room.name,
            currentX,
            startY,
            room.width,
            room.id === 'DLL_MUSIC_ARTS' ? dllHeight : aHeight,
            room.status,
            room.requests,
            room.special
          ));
          currentX += room.width + gap;
        });

        const hallwayY = startY + aHeight + gap;
        const hallwayWidth = currentX - startX - gap;
        rooms.push(createRoom(
          'HALLWAY',
          'HALL',
          'Main Hallway',
          startX,
          hallwayY,
          hallwayWidth,
          hallwayHeight,
          'no_request',
          0,
          'hallway'
        ));

        const bottomRooms = [
          { id: 'SSC_OFFICE', number: 'SSC', name: 'SSC Office', status: 'pending', requests: 2, width: officeWidth },
          { id: 'CR_FEMALE', number: 'CR F', name: 'Female CR', status: 'in_progress', requests: 1, width: officeWidth, special: 'cr' },
          { id: 'CR_MALE', number: 'CR M', name: 'Male CR', status: 'pending', requests: 1, width: officeWidth, special: 'cr' },
          { id: 'A11', number: 'A11', name: 'Room A11', status: 'no_request', requests: 0, width: aWidth },
          { id: 'A9', number: 'A9', name: 'Room A9', status: 'pending', requests: 1, width: aWidth },
          { id: 'A7', number: 'A7', name: 'Room A7', status: 'in_progress', requests: 2, width: aWidth },
          { id: 'A5', number: 'A5', name: 'Room A5', status: 'no_request', requests: 0, width: aWidth },
          { id: 'A3', number: 'A3', name: 'Room A3', status: 'no_request', requests: 0, width: aWidth },
          { id: 'A1', number: 'A1', name: 'Room A1', status: 'no_request', requests: 0, width: aWidth }
        ];

        currentX = startX;
        const bottomY = hallwayY + hallwayHeight + gap;
        bottomRooms.forEach(room => {
          rooms.push(createRoom(
            room.id,
            room.number,
            room.name,
            currentX,
            bottomY,
            room.width,
            room.id.startsWith('A') ? aHeight : officeHeight,
            room.status,
            room.requests,
            room.special
          ));
          currentX += room.width + gap;
        });

        const canvasWidth = currentX + startX;
        const canvasHeight = bottomY + aHeight + startY;

        return { rooms, canvasWidth, canvasHeight };
      }
    },
    'ANNEX': {
 'GROUND FLOOR': () => {
    const rooms = [];
    const startX = 50;
    const startY = 50;
    const officeWidth = 120;
    const officeHeight = 80;
    const stairsWidth = 60;
    const stairsHeight = 60;
    const roomWidth = 80;
    const roomHeight = 100;
    const crWidth = 70;
    const crHeight = 50;
    const gap = 15;
    const hallwayHeight = 50;

    let currentY = startY;
    
    rooms.push(createRoom(
      'GUIDANCE',
      'GUIDANCE',
      'Guidance Office',
      startX,
      currentY,
      officeWidth,
      officeHeight,
      'in_progress',
      1
    ));
    
    rooms.push(createRoom(
      'STAIRS',
      'STAIRS',
      'Stairs',
      startX + officeWidth + gap,
      currentY,
      stairsWidth,
      stairsHeight,
      'no_request',
      0,
      'stairs'
    ));
    
    currentY += officeHeight + gap;
    
    rooms.push(createRoom(
      'CLINIC',
      'CLINIC',
      'Clinic',
      startX,
      currentY,
      officeWidth,
      officeHeight,
      'in_progress',
      1
    ));

    const roomsStartX = startX + officeWidth + stairsWidth + gap * 2;
    const roomsStartY = startY;
    
    const roomNumbers = ['101', '102', '103', '104', '105'];
    let currentX = roomsStartX;
    
    roomNumbers.forEach((num, index) => {
      rooms.push(createRoom(
        num,
        num,
        `Room ${num}`,
        currentX,
        roomsStartY,
        roomWidth,
        roomHeight,
        num === '101' || num === '102' ? 'pending' : 
        (num === '103' ? 'completed' : 'no_request'),
        num === '101' || num === '102' ? 1 : 
        (num === '103' ? 1 : 0)
      ));
      currentX += roomWidth + gap;
    });
    
    const crStartX = currentX;
    const totalCRHeight = crHeight * 2 + gap;
    const crVerticalCenter = roomsStartY + (roomHeight - totalCRHeight) / 2;
    
    rooms.push(createRoom(
      'CR_FEMALE_GF',
      'CR F',
      'Female CR',
      crStartX,
      crVerticalCenter,
      crWidth,
      crHeight,
      'in_progress',
      1
    ));
    
    rooms.push(createRoom(
      'CR_MALE_GF',
      'CR M',
      'Male CR',
      crStartX,
      crVerticalCenter + crHeight + gap,
      crWidth,
      crHeight,
      'pending',
      1
    ));
    
    const hallwayY = roomsStartY + roomHeight + gap;
    const hallwayStartX = roomsStartX;
    const hallwayEndX = crStartX + crWidth;
    
    rooms.push({
      id: 'HALLWAY_GF',
      label: 'HALL',
      name: 'Hallway',
      x: hallwayStartX,
      y: hallwayY,
      width: hallwayEndX - hallwayStartX,
      height: hallwayHeight,
      status: 'no_request',
      requests: 0,
      special: 'hallway',
      color: '#DBEAFE',
      borderColor: '#93C5FD'
    });
    
    const propertyY = hallwayY + hallwayHeight + gap;
    const propertyX = roomsStartX;
    
    rooms.push(createRoom(
      'PROPERTY',
      'PROPERTY',
      'Property Office',
      propertyX,
      propertyY,
      officeWidth,
      officeHeight,
      'pending',
      2
    ));
    
    const bottomSectionY = propertyY + officeHeight + gap * 2;
    
    const financeEndX = startX + officeWidth * 3 + gap * 2;
    
    rooms.push(createRoom(
      'LOBBY',
      'LOBBY',
      'Lobby',
      startX,
      bottomSectionY,
      financeEndX - startX,
      officeHeight,
      'no_request',
      0
    ));
    
    const bottomOffices = [
      { id: 'REGISTRATION', name: 'Registration Office', status: 'no_request', requests: 0 },
      { id: 'PRESIDENTS_OFFICE', name: 'President\'s Office', status: 'completed', requests: 1 },
      { id: 'FINANCE', name: 'Finance Office', status: 'pending', requests: 1 }
    ];
    
    const bottomRowY = bottomSectionY + officeHeight + gap;
    currentX = startX;
    
    bottomOffices.forEach(office => {
      rooms.push(createRoom(
        office.id,
        office.name.split(' ')[0].toUpperCase(),
        office.name,
        currentX,
        bottomRowY,
        officeWidth,
        officeHeight,
        office.status,
        office.requests
      ));
      currentX += officeWidth + gap;
    });

    const leftBottomWidth = officeWidth * 3 + gap * 2;
    const rightWidth = Math.max(crStartX + crWidth, propertyX + officeWidth);
    const canvasWidth = Math.max(leftBottomWidth, rightWidth) + startX * 2;
    
    const canvasHeight = bottomRowY + officeHeight + startY;

    return { rooms, canvasWidth, canvasHeight };
  },
 '2ND FLOOR': () => {
  const rooms = [];
  const startX = 50;
  const startY = 50;
  const officeWidth = 120;
  const officeHeight = 80;
  const stairsWidth = 60;
  const stairsHeight = 60;
  const roomWidth = 80;
  const roomHeight = 100;
  const crWidth = 70;
  const crHeight = 50;
  const gap = 15;
  const hallwayHeight = 50;

  let currentY = startY;
  
  rooms.push(createRoom(
    '219',
    '219',
    'Room 219',
    startX,
    currentY,
    officeWidth,
    officeHeight,
    'pending',
    1
  ));
  
  rooms.push(createRoom(
    'STAIRS_2F',
    'STAIRS',
    'Stairs',
    startX + officeWidth + gap,
    currentY,
    stairsWidth,
    stairsHeight,
    'no_request',
    0,
    'stairs'
  ));
  
  const roomsStartX = startX + officeWidth + stairsWidth + gap * 2;
  const roomsStartY = startY;
  
  const topRowRooms = ['201', '202', '203', '204', '205', '206'];
  let currentX = roomsStartX;
  
  topRowRooms.forEach((num, index) => {
    rooms.push(createRoom(
      num,
      num,
      `Room ${num}`,
      currentX,
      roomsStartY,
      roomWidth,
      roomHeight,
      num === '201' || num === '202' || num === '204' ? 'pending' : 
      (num === '203' ? 'completed' : 
      (num === '206' ? 'in_progress' : 'no_request')),
      num === '201' || num === '202' || num === '204' ? 1 : 
      (num === '203' ? 1 : 
      (num === '206' ? 2 : 0))
    ));
    currentX += roomWidth + gap;
  });
  
  const crStartX = currentX;
  const totalCRHeight = crHeight * 2 + gap;
  const crVerticalCenter = roomsStartY + (roomHeight - totalCRHeight) / 2;
  
  rooms.push(createRoom(
    'CR_FEMALE_2F',
    'CR F',
    'Female CR',
    crStartX,
    crVerticalCenter,
    crWidth,
    crHeight,
    'in_progress',
    1
  ));
  
  rooms.push(createRoom(
    'CR_MALE_2F',
    'CR M',
    'Male CR',
    crStartX,
    crVerticalCenter + crHeight + gap,
    crWidth,
    crHeight,
    'pending',
    1
  ));
  
  const hallwayY = roomsStartY + roomHeight + gap;
  const hallwayStartX = roomsStartX;
  const hallwayEndX = crStartX + crWidth;
  
  rooms.push({
    id: 'HALLWAY_2F',
    label: 'HALL',
    name: 'Hallway',
    x: hallwayStartX,
    y: hallwayY,
    width: hallwayEndX - hallwayStartX,
    height: hallwayHeight,
    status: 'no_request',
    requests: 0,
    special: 'hallway',
    color: '#DBEAFE',
    borderColor: '#93C5FD'
  });
  
  const bottomRowY = hallwayY + hallwayHeight + gap;
  const bottomRowStartX = hallwayStartX;
  
  const bottomRooms = [
    { id: '213', status: 'pending', requests: 1 },
    { id: '212', status: 'no_request', requests: 0 },
    { id: '211', status: 'completed', requests: 1 },
    { id: '210', status: 'no_request', requests: 0 },
    { id: '209', status: 'in_progress', requests: 1 },
    { id: '208', status: 'no_request', requests: 0 },
    { id: '207', status: 'completed', requests: 1 }
  ];
  
  let bottomCurrentX = bottomRowStartX;
  
  bottomRooms.forEach(room => {
    rooms.push(createRoom(
      room.id,
      room.id,
      `Room ${room.id}`,
      bottomCurrentX,
      bottomRowY,
      roomWidth,
      roomHeight,
      room.status,
      room.requests
    ));
    bottomCurrentX += (roomWidth + gap);
  });
  
  const avrWidth = officeWidth + stairsWidth + gap;
  const avrHeight = roomHeight;
  const avrX = startX;
  const avrY = bottomRowY;
  
  rooms.push(createRoom(
    'AVR_ROOM',
    'AVR',
    'AVR Room',
    avrX,
    avrY,
    avrWidth,
    avrHeight,
    'completed',
    1
  ));

  const leftSideWidth = avrWidth;
  const rightWidth = Math.max(crStartX + crWidth, bottomCurrentX);
  const canvasWidth = Math.max(leftSideWidth + gap, rightWidth) + startX * 2;
  
  const canvasHeight = bottomRowY + roomHeight + startY;

  return { rooms, canvasWidth, canvasHeight };
},
      '3RD FLOOR': () => {
  const rooms = [];
  const startX = 50;
  const startY = 50;
  const stairsWidth = 60;
  const stairsHeight = 80;
  const gap = 20;
  
  const speechLabWidth = 120;
  const speechLabHeight = 100;
  
  const comLabWidth = speechLabWidth + stairsWidth + gap;
  const comLabHeight = 120;
  
  const hallwayHeight = 40;

  rooms.push(createRoom(
    'SPEECH_LAB',
    'SPEECH LAB',
    'Speech Laboratory',
    startX,
    startY,
    speechLabWidth,
    speechLabHeight,
    'in_progress',
    3
  ));

  rooms.push(createRoom(
    'STAIRS_3F',
    'STAIRS',
    'Stairs',
    startX + speechLabWidth + gap,
    startY,
    stairsWidth,
    stairsHeight,
    'no_request',
    0,
    'stairs'
  ));

  const comLab3X = startX + speechLabWidth + stairsWidth + gap * 2;
  rooms.push(createRoom(
    'COMLAB_3',
    'COMLAB 3',
    'Computer Lab 3',
    comLab3X,
    startY,
    comLabWidth,
    comLabHeight,
    'no_request',
    0
  ));

  const comLab4X = comLab3X + comLabWidth + gap;
  rooms.push(createRoom(
    'COMLAB_5',
    'COMLAB 5',
    'Computer Lab 5',
    comLab4X,
    startY,
    comLabWidth,
    comLabHeight,
    'in_progress',
    1
  ));

  const hallwayY = startY + comLabHeight + gap;
  const hallwayWidth = comLabWidth * 2 + gap;
  rooms.push({
    id: 'HALLWAY_3F',
    label: 'HALL',
    name: 'Hallway',
    x: comLab3X,
    y: hallwayY,
    width: hallwayWidth,
    height: hallwayHeight,
    status: 'no_request',
    requests: 0,
    special: 'hallway',
    color: '#DBEAFE',
    borderColor: '#93C5FD'
  });

  const bottomRowY = hallwayY + hallwayHeight + gap;
  
  rooms.push(createRoom(
    'COMLAB_1',
    'COMLAB 1',
    'Computer Lab 1',
    startX,
    bottomRowY,
    comLabWidth,
    comLabHeight,
    'pending',
    1
  ));

  const comLab2X = startX + comLabWidth + gap;
  rooms.push(createRoom(
    'COMLAB_2',
    'COMLAB 2',
    'Computer Lab 2',
    comLab2X,
    bottomRowY,
    comLabWidth,
    comLabHeight,
    'completed',
    2
  ));

  rooms.push(createRoom(
    'COMLAB_4',
    'COMLAB 4',
    'Computer Lab 4',
    comLab4X,
    bottomRowY,
    comLabWidth,
    comLabHeight,
    'pending',
    1
  ));

  const totalWidth = Math.max(
    startX + comLabWidth * 2 + gap,
    comLab4X + comLabWidth
  );
  
  const maxBottom = bottomRowY + comLabHeight;
  
  const canvasWidth = totalWidth + startX;
  const canvasHeight = maxBottom + startY;

  return { rooms, canvasWidth, canvasHeight };
},
'4TH FLOOR': () => {
    const rooms = [];
    const startX = 50;
    const startY = 50;
    const officeWidth = 120;
    const officeHeight = 100;
    const stairsWidth = 60;
    const stairsHeight = 80;
    const gap = 20;
    
    rooms.push(createRoom('OFFICE_4F', 'OFFICE', 'Office', startX, startY, officeWidth, officeHeight, 'no_request', 0));
    
    const stairsY = startY + (officeHeight - stairsHeight) / 2;
    rooms.push(createRoom('STAIRS_4F', 'STAIRS', 'Stairs', startX + officeWidth + gap, stairsY, stairsWidth, stairsHeight, 'no_request', 0, 'stairs'));
    
    const room401Height = officeHeight * 2;
    const room401Width = officeWidth;
    rooms.push(createRoom('401', '401', 'Room 401', startX, startY + officeHeight + gap, room401Width, room401Height, 'pending', 1));
    
    const room402Height = room401Height / 2;
    const room402Width = room401Width * 2;
    
    const room402Y = startY + officeHeight + gap + (room401Height - room402Height);
    rooms.push(createRoom('402', '402', 'Room 402', startX + room401Width + gap, room402Y, room402Width, room402Height, 'in_progress', 1));

    const topRowWidth = officeWidth + stairsWidth + gap;
    const bottomRowWidth = room401Width + room402Width + gap;
    const totalWidth = Math.max(topRowWidth, bottomRowWidth) + startX * 2;
    
    const totalHeight = startY + officeHeight + gap + room401Height + 40;

    return { 
        rooms, 
        canvasWidth: totalWidth, 
        canvasHeight: totalHeight 
    };
}
    }
  };

  const layout = layouts[building]?.[floor];
  return layout ? layout() : { rooms: [], canvasWidth: 800, canvasHeight: 600 };
};

const FloorsBuildingBlueprint = () => {
  const [currentBuilding, setCurrentBuilding] = useState('DFA BUILDING');
  const [currentFloor, setCurrentFloor] = useState('2ND FLOOR');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [blueprintData, setBlueprintData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: '', description: '', priority: 'medium' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0
  });
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const modalRef = useRef(null);

  const buildings = [
    { id: 'NEW_BUILDING', name: 'NEW BUILDING', floors: ['GROUND FLOOR', '2ND FLOOR', '3RD FLOOR'] },
    { id: 'DFA_BUILDING', name: 'DFA BUILDING', floors: ['2ND FLOOR'] },
    { id: 'ANNEX', name: 'ANNEX', floors: ['GROUND FLOOR', '2ND FLOOR', '3RD FLOOR', '4TH FLOOR'] }
  ];

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/rooms/by_building_floor/`, {
        params: {
          building: currentBuilding,
          floor: currentFloor
        }
      });
      
      if (response.data && response.data.length > 0) {
        const blueprint = getDefaultRoomsForFloor(currentBuilding, currentFloor);
        const updatedRooms = blueprint.rooms.map(room => {
          const apiRoom = response.data.find(r => 
            r.id === room.id || 
            r.room_id === room.id ||
            r.room_number === room.room_number ||
            (r.name && r.name.toLowerCase() === room.room_name.toLowerCase())
          );
          return apiRoom ? { 
            ...room, 
            ...apiRoom,
            id: apiRoom.id || room.id,
            room_number: apiRoom.room_number || room.room_number,
            room_name: apiRoom.name || apiRoom.room_name || room.room_name,
            status: apiRoom.status || room.status,
            request_count: apiRoom.request_count || apiRoom.requests_count || room.request_count || 0
          } : room;
        });
        setBlueprintData({ ...blueprint, rooms: updatedRooms });
        
        const stats = {
          total: updatedRooms.length,
          pending: updatedRooms.filter(r => r.status === 'pending').length,
          in_progress: updatedRooms.filter(r => r.status === 'in_progress').length,
          completed: updatedRooms.filter(r => r.status === 'completed').length
        };
        setStatistics(stats);
      } else {
        const blueprint = getDefaultRoomsForFloor(currentBuilding, currentFloor);
        setBlueprintData(blueprint);
        
        const stats = {
          total: blueprint.rooms.length,
          pending: blueprint.rooms.filter(r => r.status === 'pending').length,
          in_progress: blueprint.rooms.filter(r => r.status === 'in_progress').length,
          completed: blueprint.rooms.filter(r => r.status === 'completed').length
        };
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load room data. Using default layout.');
      
      const blueprint = getDefaultRoomsForFloor(currentBuilding, currentFloor);
      setBlueprintData(blueprint);
      
      const stats = {
        total: blueprint.rooms.length,
        pending: blueprint.rooms.filter(r => r.status === 'pending').length,
        in_progress: blueprint.rooms.filter(r => r.status === 'in_progress').length,
        completed: blueprint.rooms.filter(r => r.status === 'completed').length
      };
      setStatistics(stats);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, currentBuilding, currentFloor]);

  const fetchRoomRequests = async (roomId) => {
    if (!roomId) return;
    
    setIsLoadingRequests(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/requests/`, {
        params: { room_id: roomId }
      });
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to load requests.');
      setRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleRoomClick = (room) => {
    if (room.special === 'title' || room.special === 'scale') return;
    
    const roomId = room.id || room.room_id;
    if (!roomId) {
      console.error('Room has no ID:', room);
      return;
    }
    
    setSelectedRoom({...room, id: roomId});
    fetchRoomRequests(roomId);
  };

  const handleSubmitRequest = async () => {
    if (!selectedRoom || !newRequest.title.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const requestData = {
        room: selectedRoom.id,
        title: newRequest.title.trim(),
        description: newRequest.description.trim(),
        priority: newRequest.priority,
        status: 'pending'
      };
      
      await axios.post(`${API_BASE_URL}/api/requests/`, requestData);
      
      setNewRequest({ title: '', description: '', priority: 'medium' });
      setShowRequestModal(false);
      
      await fetchRooms();
      await fetchRoomRequests(selectedRoom.id);
      
    } catch (error) {
      console.error('Error submitting request:', error);
      setError('Failed to submit request. Please try again.');
      
      if (blueprintData) {
        const updatedRooms = blueprintData.rooms.map(r => 
          r.id === selectedRoom.id 
            ? { ...r, status: 'pending', request_count: (r.request_count || 0) + 1 }
            : r
        );
        setBlueprintData({ ...blueprintData, rooms: updatedRooms });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const handleExportPDF = () => {
    alert('PDF export would be implemented here. For now, you can use browser print (Ctrl+P) and save as PDF.');
  };

  const getFilteredRooms = () => {
    if (!blueprintData) return [];
    
    let filtered = blueprintData.rooms;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(room => room.status === statusFilter);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(room => 
        room.room_number.toLowerCase().includes(term) ||
        room.room_name.toLowerCase().includes(term) ||
        (room.id && room.id.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  };

  useEffect(() => {
    fetchRooms();
  }, [currentBuilding, currentFloor, fetchRooms]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (hoveredRoom && tooltipRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        
        let x = e.clientX - containerRect.left + 20;
        let y = e.clientY - containerRect.top + 20;
        
        if (x + tooltipRect.width > containerRect.width) {
          x = containerRect.width - tooltipRect.width - 10;
        }
        if (y + tooltipRect.height > containerRect.height) {
          y = containerRect.height - tooltipRect.height - 10;
        }
        if (x < 10) x = 10;
        if (y < 10) y = 10;
        
        tooltipRef.current.style.left = `${x}px`;
        tooltipRef.current.style.top = `${y}px`;
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowRequestModal(false);
      }
    };

    if (hoveredRoom) {
      document.addEventListener('mousemove', handleMouseMove);
    }
    
    if (showRequestModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hoveredRoom, showRequestModal]);

  const renderRoom = (room) => {
    const isHovered = hoveredRoom?.id === room.id;
    const isSelected = selectedRoom?.id === room.id;
    const hasRequests = room.request_count > 0;
    
    if (room.special === 'title' || room.special === 'scale') {
      return (
        <g key={room.id}>
          <text
            x={room.x + room.width / 2}
            y={room.y + room.height / 2}
            textAnchor="middle"
            fill={room.special === 'title' ? '#1E3A8A' : '#374151'}
            fontSize={room.special === 'title' ? '14' : '12'}
            fontWeight={room.special === 'title' ? 'bold' : 'normal'}
            fontFamily="monospace"
            className="select-none"
          >
            {room.room_number}
          </text>
        </g>
      );
    }
    
    // Updated fill colors for blueprint aesthetic
    const fillColor = room.special === 'stairs' ? BLUEPRINT_STAIRS : 
                     room.special === 'hallway' ? BLUEPRINT_HALLWAY : 
                     room.special === 'cr' ? BLUEPRINT_CR :
                     BLUEPRINT_PAPER;
    const strokeColor = isSelected ? '#3B82F6' : 
                       hasRequests ? statusColors[room.status] : 
                       BLUEPRINT_LINE;
    const strokeWidth = isSelected ? 3 : (isHovered ? 2 : 1.5);
    const strokeDasharray = room.special === 'hallway' ? "5,3" : "none";

    return (
      <g
        key={room.id}
        onMouseEnter={() => setHoveredRoom(room)}
        onMouseLeave={() => setHoveredRoom(null)}
        onClick={() => handleRoomClick(room)}
        className="cursor-pointer transition-all duration-200"
        style={{
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          transformOrigin: 'center'
        }}
      >
        <rect
          x={room.x}
          y={room.y}
          width={room.width}
          height={room.height}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          rx="2"
          ry="2"
          className="transition-all duration-200"
        />
        
        {room.special === 'stairs' && (
          <>
            <line x1={room.x + 10} y1={room.y + 10} x2={room.x + room.width - 10} y2={room.y + 10} stroke="#93C5FD" strokeWidth="1" />
            <line x1={room.x + 10} y1={room.y + 30} x2={room.x + room.width - 10} y2={room.y + 30} stroke="#93C5FD" strokeWidth="1" />
            <line x1={room.x + 10} y1={room.y + 50} x2={room.x + room.width - 10} y2={room.y + 50} stroke="#93C5FD" strokeWidth="1" />
            <line x1={room.x + 10} y1={room.y + 70} x2={room.x + room.width - 10} y2={room.y + 70} stroke="#93C5FD" strokeWidth="1" />
            <line x1={room.x + 10} y1={room.y + 90} x2={room.x + room.width - 10} y2={room.y + 90} stroke="#93C5FD" strokeWidth="1" />
          </>
        )}
        
        <text
          x={room.x + room.width / 2}
          y={room.y + room.height / 2}
          textAnchor="middle"
          fill={BLUEPRINT_LABEL}
          fontSize={Math.min(16, Math.max(10, room.width / 8))}
          fontWeight="600"
          className="select-none"
        >
          {room.room_number}
        </text>
        
        {room.special !== 'hallway' && (
          <text
            x={room.x + room.width / 2}
            y={room.y + room.height - 8}
            textAnchor="middle"
            fill={BLUEPRINT_TEXT}
            fontSize="10"
            className="select-none"
          >
            {room.room_name.length > 20 ? room.room_name.substring(0, 20) + '...' : room.room_name}
          </text>
        )}
        
        {room.status !== 'no_request' && (
          <circle
            cx={room.x + room.width - 12}
            cy={room.y + 12}
            r="6"
            fill={statusColors[room.status]}
            stroke="#FFFFFF"
            strokeWidth="1"
          />
        )}
        
        {hasRequests && (
          <g>
            <circle
              cx={room.x + 12}
              cy={room.y + 12}
              r="8"
              fill="#EF4444"
              stroke="#FFFFFF"
              strokeWidth="1"
            />
            <text
              x={room.x + 12}
              y={room.y + 15}
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="bold"
            >
              {room.request_count}
            </text>
          </g>
        )}
        
        {showDimensions && room.special !== 'hallway' && !room.special && (
          <>
            <text
              x={room.x + room.width / 2}
              y={room.y - 5}
              textAnchor="middle"
              fill="#64748B"
              fontSize="8"
            >
              {room.width}ft
            </text>
            <text
              x={room.x - 15}
              y={room.y + room.height / 2}
              textAnchor="middle"
              fill="#64748B"
              fontSize="8"
              transform={`rotate(-90, ${room.x - 15}, ${room.y + room.height / 2})`}
            >
              {room.height}ft
            </text>
          </>
        )}
        
        {isHovered && (
          <rect
            x={room.x}
            y={room.y}
            width={room.width}
            height={room.height}
            fill="rgba(59, 130, 246, 0.1)"
            rx="2"
            ry="2"
          />
        )}
      </g>
    );
  };

  const renderBlueprint = () => {
    if (!blueprintData) return null;
    
    const { canvasWidth, canvasHeight } = blueprintData;
    const filteredRooms = getFilteredRooms();
    const viewWidth = Math.min(1200, canvasWidth);
    const viewHeight = Math.min(700, canvasHeight);
    
    return (
      <div className="relative">
        <svg 
          width={viewWidth} 
          height={viewHeight} 
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            background: BLUEPRINT_BG,
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {createBlueprintPaper(canvasWidth, canvasHeight)}
          
          <rect 
            x="20" 
            y="20" 
            width={canvasWidth - 40} 
            height={canvasHeight - 40} 
            fill="url(#blueprint-pattern)"
            stroke="#93C5FD" 
            strokeWidth="1" 
            strokeOpacity="0.5"
          />
          
          {showGrid && createBlueprintGrid(canvasWidth, canvasHeight)}
          
          {filteredRooms.map(renderRoom)}
          
          {currentBuilding === 'DFA BUILDING' && currentFloor === '2ND FLOOR' && (
            <g transform={`translate(${canvasWidth - 150}, ${canvasHeight - 30})`}>
              <line x1="0" y1="0" x2="100" y2="0" stroke="#64748B" strokeWidth="2" />
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#64748B" strokeWidth="2" />
              <line x1="100" y1="-5" x2="100" y2="5" stroke="#64748B" strokeWidth="2" />
            </g>
          )}
        </svg>
        
        {(statusFilter !== 'all' || searchTerm.trim()) && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-full text-sm shadow-lg">
            Showing {filteredRooms.length} of {blueprintData.rooms.length} rooms
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-800 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`lg:w-80 ${sidebarCollapsed ? 'hidden' : 'block'} lg:block`}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Select Building
              </h3>
              <div className="space-y-2">
                {buildings.map(building => (
                  <button
                    key={building.id}
                    onClick={() => {
                      setCurrentBuilding(building.name);
                      setCurrentFloor(building.floors[0]);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentBuilding === building.name
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{building.name}</span>
                      {currentBuilding === building.name && (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                <Layers className="w-5 h-5 mr-2 text-green-600" />
                Select Floor
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {buildings
                  .find(b => b.name === currentBuilding)
                  ?.floors.map(floor => (
                    <button
                      key={floor}
                      onClick={() => setCurrentFloor(floor)}
                      className={`p-3 rounded-xl transition-all duration-300 ${
                        currentFloor === floor
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{floor}</span>
                    </button>
                  ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                <Grid className="w-5 h-5 mr-2 text-purple-600" />
                View Controls
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    showGrid ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="text-gray-700">Show Grid</span>
                  <div className={`w-6 h-6 rounded border flex items-center justify-center ${
                    showGrid ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-transparent'
                  }`}>
                    {showGrid && <div className="w-3 h-3 bg-white rounded-sm"></div>}
                  </div>
                </button>
                
                <button
                  onClick={() => setShowDimensions(!showDimensions)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    showDimensions ? 'bg-cyan-50 border border-cyan-200' : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="text-gray-700">Show Dimensions</span>
                  <Ruler className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                <Info className="w-5 h-5 mr-2 text-amber-600" />
                Floor Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Rooms</span>
                  <span className="font-bold text-gray-800">{statistics.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-gray-600">Pending</span>
                  </div>
                  <span className="font-bold text-gray-800">{statistics.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <span className="text-gray-600">In Progress</span>
                  </div>
                  <span className="font-bold text-gray-800">{statistics.in_progress}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-gray-600">Completed</span>
                  </div>
                  <span className="font-bold text-gray-800">{statistics.completed}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                <Filter className="w-5 h-5 mr-2 text-amber-600" />
                Status Legend
              </h3>
              <div className="space-y-2">
                {Object.entries(statusColors).map(([status, color]) => (
                  <div key={status} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-3" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="capitalize text-gray-700">{status.replace('_', ' ')}</span>
                    </div>
                    {statusIcons[status] && React.cloneElement(statusIcons[status], { className: "w-4 h-4 text-gray-500" })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-gray-200 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="no_request">No Request</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-white border border-gray-300 rounded-xl p-1">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <ZoomOut className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="px-3 font-medium text-gray-700">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <ZoomIn className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={handleZoomReset}
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors ml-2"
                  >
                    <Navigation className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                
                <button 
                  onClick={handleExportPDF}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-500">Loading blueprint...</p>
              </div>
            ) : (
              <div 
                ref={containerRef}
                className="overflow-auto rounded-xl bg-gradient-to-br from-blue-50 to-gray-100 p-4 relative"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease'
                }}
              >
                <div className="inline-block">
                  {renderBlueprint()}
                </div>
              </div>
            )}
          </div>

          {selectedRoom && (
            <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedRoom.room_name}</h3>
                  <p className="text-gray-600">Room {selectedRoom.room_number}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div 
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: `${statusColors[selectedRoom.status]}20`,
                      color: statusColors[selectedRoom.status]
                    }}
                  >
                    {selectedRoom.status.replace('_', ' ').toUpperCase()}
                  </div>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Request
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Recent Requests ({requests.length})</h4>
                  {isLoadingRequests && (
                    <div className="flex items-center text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {requests.length > 0 ? (
                    requests.map(request => (
                      <div key={request.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-800">{request.title}</h5>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            request.priority === 'high' ? 'bg-red-100 text-red-700' :
                            request.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {request.priority?.toUpperCase() || 'MEDIUM'}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{request.created_at ? new Date(request.created_at).toLocaleDateString() : 'No date'}</span>
                          <div className="flex items-center">
                            <div 
                              className="w-2 h-2 rounded-full mr-2"
                              style={{ backgroundColor: statusColors[request.status] || statusColors.no_request }}
                            ></div>
                            <span className="capitalize">{request.status?.replace('_', ' ') || 'unknown'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No requests for this room yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div 
            ref={modalRef}
            className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">New Maintenance Request</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Room</label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-300 text-gray-700">
                  {selectedRoom?.room_name} ({selectedRoom?.room_number})
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Title *</label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., AC Repair, Light Replacement"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                  placeholder="Describe the issue in detail..."
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Priority</label>
                <select
                  value={newRequest.priority}
                  onChange={(e) => setNewRequest({...newRequest, priority: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={!newRequest.title.trim() || isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {hoveredRoom && (
        <div 
          ref={tooltipRef}
          className="fixed z-40 bg-white border border-gray-200 rounded-xl p-4 shadow-xl backdrop-blur-sm max-w-xs pointer-events-none"
          style={{
            left: '0',
            top: '0'
          }}
        >
          <div className="flex items-center space-x-3 mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: statusColors[hoveredRoom.status] || statusColors.no_request }}
            ></div>
            <h4 className="font-bold text-gray-800">{hoveredRoom.room_name}</h4>
          </div>
          <p className="text-gray-600 text-sm">Room {hoveredRoom.room_number}</p>
          <p className="text-sm mt-2 text-gray-700 capitalize">Status: {hoveredRoom.status?.replace('_', ' ') || 'no request'}</p>
          <p className="text-sm text-gray-500">
            Requests: {hoveredRoom.request_count || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Dimensions: {hoveredRoom.width}ft × {hoveredRoom.height}ft
          </p>
        </div>
      )}
    </div>
  );
};

export default FloorsBuildingBlueprint;