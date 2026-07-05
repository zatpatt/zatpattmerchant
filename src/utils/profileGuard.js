//src\utils\profileGuard.js

export const isProfileComplete = () => {
  const completion =
    Number(
      localStorage.getItem(
        "profile_completion"
      ) || 0
    );

  return completion >= 100;
};