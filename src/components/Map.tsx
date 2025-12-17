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
}

function createContactIcon(contact: Contact, isHighlighted: boolean, isFaded: boolean): L.DivIcon {
  const initials = getInitials(contact.firstName, contact.lastName);
  const stateClass = isHighlighted ? 'highlighted' : isFaded ? 'faded' : '';
  const statusClass = contact.status === 'unclaimed' ? 'unclaimed' : contact.status === 'invited' ? 'invited' : '';
  
  const html = contact.photoUrl
    ? `<div class="contact-pin ${stateClass} ${statusClass}">
        <img src="${contact.photoUrl}" alt="${contact.firstName}" />
      </div>`
    : `<div class="contact-pin ${stateClass} ${statusClass}">
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
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const clusterGroupRef = useRef<any>(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return;

    // World bounds to constrain the map
    const worldBounds = L.latLngBounds(
      L.latLng(-85, -180),
      L.latLng(85, 180)
    );

    const map = L.map('map', {
      center: [30, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
      zoomControl: true,
      attributionControl: true,
    });

    // Minimal, neutral tile layer (CartoDB Positron)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
      noWrap: true,
      bounds: worldBounds,
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

      const marker = L.marker([contact.location.lat, contact.location.lng], {
        icon: createContactIcon(contact, isHighlighted, isFaded),
      });

      marker.on('click', () => {
        onSelectContact(contact);
      });

      clusterGroup.addLayer(marker);
      markersRef.current.set(contact.id, marker);
    });
  }, [contacts, filteredIds, hasActiveSearch, onSelectContact]);

  // Update marker icons when search changes
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) return;

      const isHighlighted = hasActiveSearch && filteredIds.has(id);
      const isFaded = hasActiveSearch && !filteredIds.has(id);

      marker.setIcon(createContactIcon(contact, isHighlighted, isFaded));
    });
  }, [contacts, filteredIds, hasActiveSearch]);

  // No longer pan/zoom to selected contact - just open the panel
  // Removed zoom behavior per UX requirements

  return <div id="map" className="w-full h-full" />;
}
