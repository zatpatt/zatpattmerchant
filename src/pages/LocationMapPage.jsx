import React, {
  useEffect,
  useState,
} from "react";

import {
  GoogleMap,
} from "@react-google-maps/api";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
} from "lucide-react";

import pickupPin from "../assets/pickup-pin.png";

export default function LocationMapPage() {

  const navigate =
    useNavigate();

    const [state, setState] = useState("");
    const [pincode, setPincode] = useState("");

  const [position, setPosition] =
    useState([
      19.9975,
      73.7898,
    ]);

  const [mapRef, setMapRef] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [locationName,
    setLocationName] =
    useState("");

  const [area,
    setArea] =
    useState("");

  const [city,
    setCity] =
    useState("");

  useEffect(() => {

    navigator.geolocation.getCurrentPosition(

      (pos) => {

        setPosition([
          pos.coords.latitude,
          pos.coords.longitude,
        ]);

        setLoading(false);

      },

      () => {

        setLoading(false);

      }

    );

  }, []);

  useEffect(() => {

    if (!window.google)
      return;

    const geocoder =
      new window.google.maps.Geocoder();

    geocoder.geocode(

      {
        location: {
          lat: position[0],
          lng: position[1],
        },
      },

      (results, status) => {

        if (
          status === "OK" &&
          results?.[0]
        ) {

          setLocationName(
            results[0]
              .formatted_address
          );

          const components =
            results[0]
              .address_components ||
            [];

          const get = (type) =>
            components.find(
              (c) =>
                c.types.includes(
                  type
                )
            )?.long_name || "";

          setArea(
            get(
              "sublocality_level_1"
            ) ||
            get(
              "sublocality"
            ) ||
            get(
              "locality"
            )
          );

          setState(
            get("administrative_area_level_1")
          );

          setPincode(
            get("postal_code")
          );

          setCity(
            get(
              "locality"
            ) ||
            get(
              "administrative_area_level_2"
            )
          );
        }
      }

    );

  }, [position]);

  const handleSave =
    () => {

      localStorage.setItem(
  "merchant_location",
  JSON.stringify({
    latitude: position[0],
    longitude: position[1],
    address: locationName,
    area,
    city,
    state,
    pincode,
  })
);

navigate("/profile");

    };


  if (loading) {

    return (
      <div className="h-screen flex items-center justify-center">
        Loading Map...
      </div>
    );

  }

  return (
    <div className="h-screen flex flex-col">

      <div className="h-[65vh] relative">

        <button
          onClick={() =>
            navigate(-1)
          }
          className="absolute top-4 left-4 z-20 bg-white p-2 rounded-full shadow"
        >
          <ArrowLeft size={20} />
        </button>

        <GoogleMap
          mapContainerStyle={{
            width: "100%",
            height: "100%",
          }}
          center={{
            lat: position[0],
            lng: position[1],
          }}
          zoom={16}
          onLoad={(map) =>
            setMapRef(map)
          }
          onIdle={() => {

            if (!mapRef)
              return;

            const center =
              mapRef.getCenter();

            setPosition([
              center.lat(),
              center.lng(),
            ]);

          }}
        />

        <div
          className="
            absolute
            top-1/2
            left-1/2
            -translate-x-1/2
            -translate-y-full
            pointer-events-none
          "
        >
          <img
            src={pickupPin}
            alt=""
            className="w-10 h-10"
          />
        </div>

      </div>

      <div
        className="
          bg-white
          rounded-t-3xl
          p-5
          shadow-xl
          -mt-6
          relative
          z-20
        "
      >

       <h2 className="font-bold text-lg">
        Confirm Store Location
      </h2>

      <p className="text-orange-600 text-sm mt-2">
        Move the map until the pin is
        exactly on your store entrance.
      </p>

        <p className="text-sm text-gray-600 mb-5">
          {locationName}
        </p>

        <button
        onClick={handleSave}
        className="
          w-full
          h-14
          mt-5
          bg-orange-500
          text-white
          rounded-2xl
          font-semibold
          shadow-lg
        "
      >
        Confirm Location
      </button>

      </div>

    </div>
  );
}