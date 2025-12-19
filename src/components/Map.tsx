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
  connections?: globalThis.Map<string, string[]>;
  highlightedContactId?: string | null;
  onHighlightContact?: (contactId: string | null) => void;
}

function createContactIcon(
  contact: Contact, 
  isHighlighted: boolean, 
  isFaded: boolean,
  groupColor?: string,
  isConnected?: boolean,
  isConnectionHighlighted?: boolean
): L.DivIcon {
  const initials = getInitials(contact.firstName, contact.lastName);
  let stateClass = isHighlighted ? 'highlighted' : isFaded ? 'faded' : '';
  
  // Connection-based dimming takes precedence
  if (isConnectionHighlighted !== undefined) {
    if (!isConnected) {
      stateClass = 'connection-dimmed';
    } else if (isConnectionHighlighted) {
      stateClass = 'connection-highlighted';
    }
  }
  
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
  connections,
  highlightedContactId,
  onHighlightContact,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const clusterGroupRef = useRef<any>(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return;

    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Get viewport dimensions
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    // Calculate minZoom so world fills viewport
    // At zoom level z, world width in pixels = 256 * 2^z
    // We need the world to be at least as wide as the container
    const minZoomWidth = Math.log2(containerWidth / 256);
    const minZoomHeight = Math.log2(containerHeight / 256);
    const minZoom = Math.ceil(Math.max(minZoomWidth, minZoomHeight, 1));

    // Bounds for the entire world
    const bounds = L.latLngBounds(
      L.latLng(-90, -180),
      L.latLng(90, 180)
    );

    const map = L.map('map', {
      center: [30, 0],
      zoom: minZoom,
      minZoom: minZoom,
      maxZoom: 18,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0,
      zoomControl: true,
      attributionControl: true,
      bounceAtZoomLimits: false,
    });

    // Calm, ocean-focused tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
      noWrap: true,
    }).addTo(map);

    // Handle window resize to update minZoom
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      const newMinZoom = Math.ceil(Math.max(
        Math.log2(newWidth / 256),
        Math.log2(newHeight / 256),
        1
      ));
      map.setMinZoom(newMinZoom);
      if (map.getZoom() < newMinZoom) {
        map.setZoom(newMinZoom);
      }
    };
    window.addEventListener('resize', handleResize);

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
      window.removeEventListener('resize', handleResize);
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
      const groupColor = activeGroupId && activeGroupColor ? activeGroupColor : undefined;
      
      // Connection highlighting
      let isConnected: boolean | undefined;
      let isConnectionHighlighted: boolean | undefined;
      if (highlightedContactId && connections) {
        const highlightedConnections = connections.get(highlightedContactId) || [];
        isConnected = contact.id === highlightedContactId || highlightedConnections.includes(contact.id);
        isConnectionHighlighted = contact.id === highlightedContactId;
      }

      const marker = L.marker([contact.location.lat, contact.location.lng], {
        icon: createContactIcon(contact, isHighlighted, isFaded, groupColor, isConnected, isConnectionHighlighted),
      });

      marker.on('click', () => {
        onSelectContact(contact);
        // Toggle connection highlight on click
        if (onHighlightContact) {
          onHighlightContact(highlightedContactId === contact.id ? null : contact.id);
        }
      });

      clusterGroup.addLayer(marker);
      markersRef.current.set(contact.id, marker);
    });
  }, [contacts, filteredIds, hasActiveSearch, onSelectContact, activeGroupId, activeGroupColor, contactGroupsMap, connections, highlightedContactId, onHighlightContact]);

  // Update marker icons when search, group, or connection highlighting changes
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) return;

      const isHighlighted = hasActiveSearch && filteredIds.has(id);
      const isFaded = hasActiveSearch && !filteredIds.has(id);
      
      // When a group is active, show the group color border
      const groupColor = activeGroupId && activeGroupColor ? activeGroupColor : undefined;
      
      // Connection highlighting
      let isConnected: boolean | undefined;
      let isConnectionHighlighted: boolean | undefined;
      if (highlightedContactId && connections) {
        const highlightedConnections = connections.get(highlightedContactId) || [];
        isConnected = contact.id === highlightedContactId || highlightedConnections.includes(contact.id);
        isConnectionHighlighted = contact.id === highlightedContactId;
      }

      marker.setIcon(createContactIcon(contact, isHighlighted, isFaded, groupColor, isConnected, isConnectionHighlighted));
    });
  }, [contacts, filteredIds, hasActiveSearch, activeGroupId, activeGroupColor, contactGroupsMap, connections, highlightedContactId]);

  // No longer pan/zoom to selected contact - just open the panel
  // Removed zoom behavior per UX requirements

  return <div id="map" className="w-full h-full" />;
}
