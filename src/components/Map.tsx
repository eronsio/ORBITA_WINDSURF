'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Contact } from '@/types/contact';
import { getInitials } from '@/lib/utils';

// Import markercluster - must be done after L is available
if (typeof window !== 'undefined') {
  require('leaflet.markercluster');
}

interface MapProps {
  contacts: Contact[];
  filteredIds: Set<string>;
  hasActiveSearch: boolean;
  onSelectContact: (contact: Contact) => void;
  selectedContactId?: string;
  activeGroupColor?: string;
  contactGroupsMap?: globalThis.Map<string, string[]>;
  activeGroupId?: string | null;
}

function createContactIcon(
  contact: Contact, 
  isHighlighted: boolean, 
  isFaded: boolean,
  groupColor?: string
): L.DivIcon {
  const initials = getInitials(contact.firstName, contact.lastName);
  const stateClass = isHighlighted ? 'highlighted' : isFaded ? 'faded' : '';
  const statusClass = contact.status === 'unclaimed' ? 'unclaimed' : contact.status === 'invited' ? 'invited' : '';
  const borderStyle = groupColor ? `border: 3px solid ${groupColor};` : '';
  
  const html = contact.photoUrl
    ? `<div class="contact-pin ${stateClass} ${statusClass}" style="${borderStyle}">
        <img src="${contact.photoUrl}" alt="${contact.firstName}" />
      </div>`
    : `<div class="contact-pin ${stateClass} ${statusClass}" style="${borderStyle}">
        <div class="initials">${initials}</div>
      </div>`;

  return L.divIcon({
    html,
    className: 'contact-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

export default function Map({
  contacts,
  filteredIds,
  hasActiveSearch,
  onSelectContact,
  selectedContactId,
  activeGroupColor,
  contactGroupsMap,
  activeGroupId,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const clusterGroupRef = useRef<any>(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return;

    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Calculate minimum zoom to fill viewport without gray areas
    const containerWidth = mapContainer.clientWidth;
    const containerHeight = mapContainer.clientHeight;
    
    // World is 360 degrees wide, 170 degrees tall (85N to 85S)
    // At zoom 0, world is 256px. Each zoom level doubles it.
    // We need zoom where: 256 * 2^zoom >= max(containerWidth, containerHeight * (360/170))
    const worldWidth = 360;
    const worldHeight = 170; // -85 to 85
    const aspectRatio = containerWidth / containerHeight;
    const worldAspect = worldWidth / worldHeight;
    
    let minZoom: number;
    if (aspectRatio > worldAspect) {
      // Container is wider than world aspect - constrain by width
      minZoom = Math.ceil(Math.log2(containerWidth / 256));
    } else {
      // Container is taller than world aspect - constrain by height
      minZoom = Math.ceil(Math.log2((containerHeight * worldWidth / worldHeight) / 256));
    }
    minZoom = Math.max(2, minZoom); // At least zoom 2

    // Set bounds with padding to prevent any gray
    const southWest = L.latLng(-85, -180);
    const northEast = L.latLng(85, 180);
    const bounds = L.latLngBounds(southWest, northEast);

    const map = L.map('map', {
      center: [20, 0],
      zoom: minZoom,
      minZoom: minZoom,
      maxZoom: 18,
      maxBounds: bounds.pad(0.1), // Small padding to prevent edge issues
      maxBoundsViscosity: 1.0,
      zoomControl: true,
      attributionControl: true,
    });

    // Calm, ocean-focused tile layer (CartoDB Voyager - softer blues)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
      noWrap: true,
    }).addTo(map);

    // Position zoom control
    map.zoomControl.setPosition('bottomright');

    // Create cluster group with custom styling
    // @ts-ignore - markerClusterGroup is added by leaflet.markercluster
    const clusterGroup = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false,
      spiderfyOnMaxZoom: false,
      spiderfyDistanceMultiplier: 1.5,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 10) size = 'medium';
        if (count > 50) size = 'large';

        return L.divIcon({
          html: `<div>${count}</div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: L.point(44, 44),
        });
      },
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
    mapRef.current = map;

    // Spiderfy cluster on click instead of zooming
    clusterGroup.on('clusterclick', (e: any) => {
      e.layer.spiderfy();
    });

    // Collapse spiderfied clusters when clicking elsewhere on map
    map.on('click', () => {
      clusterGroup.unspiderfy();
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add/update markers
  useEffect(() => {
    if (!clusterGroupRef.current) return;

    const clusterGroup = clusterGroupRef.current;

    // Clear existing markers
    clusterGroup.clearLayers();
    markersRef.current.clear();

    // Add markers for each contact
    contacts.forEach((contact) => {
      const isHighlighted = hasActiveSearch && filteredIds.has(contact.id);
      const isFaded = hasActiveSearch && !filteredIds.has(contact.id);
      
      // When a group is active, show the group color border on all visible contacts
      // (since they're already filtered to only show group members)
      const groupColor = activeGroupId && activeGroupColor ? activeGroupColor : undefined;

      const marker = L.marker([contact.location.lat, contact.location.lng], {
        icon: createContactIcon(contact, isHighlighted, isFaded, groupColor),
      });

      marker.on('click', () => {
        onSelectContact(contact);
      });

      clusterGroup.addLayer(marker);
      markersRef.current.set(contact.id, marker);
    });
  }, [contacts, filteredIds, hasActiveSearch, onSelectContact, activeGroupId, activeGroupColor, contactGroupsMap]);

  // Update marker icons when search or group changes
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) return;

      const isHighlighted = hasActiveSearch && filteredIds.has(id);
      const isFaded = hasActiveSearch && !filteredIds.has(id);
      
      // When a group is active, show the group color border
      const groupColor = activeGroupId && activeGroupColor ? activeGroupColor : undefined;

      marker.setIcon(createContactIcon(contact, isHighlighted, isFaded, groupColor));
    });
  }, [contacts, filteredIds, hasActiveSearch, activeGroupId, activeGroupColor, contactGroupsMap]);

  // No longer pan/zoom to selected contact - just open the panel
  // Removed zoom behavior per UX requirements

  return <div id="map" className="w-full h-full" />;
}
