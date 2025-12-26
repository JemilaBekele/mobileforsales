import React, { useState, useCallback, memo } from 'react';
import { Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import {
  Card,
  Text,
  XStack,
  YStack,
  Button,
  ScrollView,
  Spinner,
  H3,
  Avatar,
  Separator,
} from 'tamagui';
import { useAppSelector } from '@/(redux)/hooks';
import type { AppDispatch } from '@/(redux)/store';
import { 
  logout, 
  logoutAction, 
  selectUserName, 
  selectAuthLoading, 
  selectUser 
} from "@/(redux)/authSlice";

type ProfileRoute = 'Profile' | 'Password' | 'Waitlists';

// 1. MEMOIZED SUB-COMPONENTS
// This prevents the menu items from re-rendering unless their props actually change.
const ProfileMenuItem = memo(({ 
  icon, 
  title, 
  onPress, 
  isDestructive = false,
  showArrow = true,
  disabled = false
}: {
  icon: string;
  title: string;
  onPress: () => void;
  isDestructive?: boolean;
  showArrow?: boolean;
  disabled?: boolean;
}) => (
  <Card
    elevate
    bordered
    borderRadius="$4"
    backgroundColor="$orange1"
    borderColor="$orange4"
    marginVertical="$2"
  >
    <Card.Header padded>
      <Button
        unstyled
        flex={1}
        justifyContent="space-between"
        alignItems="center"
        flexDirection="row"
        onPress={onPress}
        paddingVertical="$2"
        disabled={disabled}
      >
        <XStack alignItems="center" space="$3">
          <Text fontSize="$5" color={isDestructive ? "$red9" : "$orange9"}>
            {icon}
          </Text>
          <Text 
            fontSize="$5" 
            color={isDestructive ? "$red11" : "$orange11"}
            fontWeight="600"
          >
            {title}
          </Text>
        </XStack>
        {showArrow && (
          <Text fontSize="$4" color="$orange8">›</Text>
        )}
      </Button>
    </Card.Header>
  </Card>
));

// Add this to fix ESLint react/display-name
ProfileMenuItem.displayName = 'ProfileMenuItem';

const UserInfoCard = memo(({ label, value }: { label: string; value: string }) => (
  <XStack justifyContent="space-between" alignItems="center" paddingVertical="$2">
    <Text fontSize="$4" fontWeight="600" color="$orange11">{label}</Text>
    <Text fontSize="$4" color="$orange12" fontWeight="500">{value}</Text>
  </XStack>
));

// Add this to fix ESLint react/display-name
UserInfoCard.displayName = 'UserInfoCard';

const Profile = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // 2. ATOMIC SELECTORS
  // Using specific selectors prevents re-rendering the whole screen when the token changes
  const fullName = useAppSelector(selectUserName) || 'Guest';
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectAuthLoading);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 3. USECALLBACK FOR STABLE FUNCTIONS
  const handleNavigation = useCallback((route: ProfileRoute) => {
    router.push(`/(tabs)/profile/${route}` as any);
  }, [router]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setShowLogoutModal(false);
      
      // We clear the state immediately to make it feel instant
      await dispatch(logout()).unwrap();
      router.replace("/(auth)/login");
    } catch (error: any) {
      dispatch(logoutAction());
      router.replace("/(auth)/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading && !isLoggingOut) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$orange1">
        <Spinner size="large" color="$orange9" />
      </YStack>
    );
  }

  const roleValue = typeof user?.role === 'string' ? user.role : user?.role?.name || 'User';
  const branchValue = typeof user?.branch === 'string' ? user.branch : user?.branch?.name || 'Not assigned';

  return (
    <YStack flex={1} backgroundColor="$orange1">
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack space="$4" padding="$4">
          <Card elevate bordered borderRadius="$4" backgroundColor="$orange1" borderColor="$orange4">
            <Card.Header padded>
              <YStack space="$4" alignItems="center">
                <Avatar circular size="$14" backgroundColor="$orange5">
                  <Avatar.Image source={{ uri: 'https://th.bing.com/th/id/OIP.fFF1AOaet4ZcLFBIfM9SGAHaHa?pid=ImgDet&w=191&h=191&c=7' }} />
                  <Avatar.Fallback backgroundColor="$orange6">
                    <Text color="$orange11" fontSize="$6" fontWeight="bold">{fullName.charAt(0).toUpperCase()}</Text>
                  </Avatar.Fallback>
                </Avatar>
                
                <YStack alignItems="center" space="$2">
                  <H3 fontWeight="bold" color="$orange12">{fullName}</H3>
                  <Text fontSize="$4" color="$orange10">{user?.email}</Text>
                </YStack>

                <Card width="100%" backgroundColor="$orange2" borderRadius="$3" padding="$3">
                  <YStack space="$1">
                    <Separator borderColor="$orange4" />
                    <UserInfoCard label="Role:" value={roleValue} />
                    <UserInfoCard label="Branch:" value={branchValue} />
                    <Separator borderColor="$orange4" />
                  </YStack>
                </Card>
              </YStack>
            </Card.Header>
          </Card>

          <YStack space="$3">
            <Text fontSize="$6" fontWeight="700" color="$orange12" paddingHorizontal="$2">Account Settings</Text>
            
            <ProfileMenuItem icon="👤" title="Account Information" onPress={() => handleNavigation('Profile')} disabled={isLoggingOut} />
            <ProfileMenuItem icon="🔒" title="Change Password" onPress={() => handleNavigation('Password')} disabled={isLoggingOut} />
            <ProfileMenuItem icon="🛒" title="Waitlist Information" onPress={() => handleNavigation('Waitlists')} disabled={isLoggingOut} />
            <ProfileMenuItem icon="🚪" title="Log Out" onPress={() => setShowLogoutModal(true)} isDestructive showArrow={false} disabled={isLoggingOut} />
          </YStack>
        </YStack>
      </ScrollView>

      {/* 4. LAZY MODAL RENDERING */}
      {showLogoutModal && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
           <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="rgba(0,0,0,0.5)">
             <Card backgroundColor="$orange1" borderRadius="$4" padding="$4" width="85%" maxWidth={400}>
                <YStack space="$4" alignItems="center">
                  <Text fontSize="$6" fontWeight="700" color="$orange12">Log Out?</Text>
                  <Text fontSize="$4" color="$orange11" textAlign="center">Are you sure you want to log out?</Text>
                  <XStack space="$3" width="100%">
                    <Button flex={1} backgroundColor="$orange3" onPress={() => setShowLogoutModal(false)}>
                      <Text color="$orange11">Cancel</Text>
                    </Button>
                    <Button flex={1} backgroundColor="$red9" onPress={handleLogout} disabled={isLoggingOut}>
                      {isLoggingOut ? <Spinner color="white" /> : <Text color="white">Log Out</Text>}
                    </Button>
                  </XStack>
                </YStack>
             </Card>
           </YStack>
        </Modal>
      )}
    </YStack>
  );
};

export default Profile;