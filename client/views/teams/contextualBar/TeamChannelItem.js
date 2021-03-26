import { ActionButton, Box, CheckBox, Icon, Menu, Option } from '@rocket.chat/fuselage';
import { usePrefersReducedMotion, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useState } from 'react';

import { roomTypes } from '../../../../app/utils/client';
import Breadcrumbs from '../../../components/Breadcrumbs';
import RoomAvatar from '../../../components/avatar/RoomAvatar';
import { useSetModal } from '../../../contexts/ModalContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { usePreventProgation } from '../../../hooks/usePreventProgation';
import ConfirmationModal from '../modals/ConfirmationModal';

export const useReactModal = (Component, props) => {
	const setModal = useSetModal();

	return useMutableCallback(() => {
		const handleClose = () => {
			setModal(null);
		};

		setModal(() => <Component onClose={handleClose} {...props} />);
	});
};

const RoomActions = ({ room }) => {
	const t = useTranslation();
	const updateRoomEndpoint = useEndpoint('POST', 'teams.updateRoom');
	const removeRoomEndpoint = useEndpoint('POST', 'teams.removeRoom');
	const deleteRoomEndpoint = useEndpoint(
		'POST',
		room.t === 'c' ? 'channels.delete' : 'groups.delete',
	);

	const RemoveFromTeamAction = useReactModal(ConfirmationModal, {
		onConfirmAction: () => {
			removeRoomEndpoint({ teamId: room.teamId, roomId: room._id });
		},
		labelButton: t('Remove'),
		content: (
			<Box is='span' size='14px'>
				{t('Team_Remove_from_team_modal_content', {
					teamName: roomTypes.getRoomName(room.t, room),
				})}
			</Box>
		),
	});

	const DeleteChannelAction = useReactModal(ConfirmationModal, {
		onConfirmAction: () => {
			deleteRoomEndpoint({ roomId: room._id });
		},
		labelButton: t('Delete'),
		content: (
			<>
				<Box is='span' size='14px' color='danger-500' fontWeight='600'>
					{t('Team_Delete_Channel_modal_content_danger')}
				</Box>
				<Box is='span' size='14px'>
					{' '}
					{t('Team_Delete_Channel_modal_content')}
				</Box>
			</>
		),
	});

	const menuOptions = useMemo(() => {
		const AutoJoinAction = () => {
			updateRoomEndpoint({
				roomId: room._id,
				isDefault: !room.teamDefault,
			});
		};

		return [
			{
				label: {
					label: t('Team_Auto-join'),
					icon: room.t === 'c' ? 'hash' : 'hashtag-lock',
				},
				action: AutoJoinAction,
			},
			{
				label: {
					label: t('Team_Remove_from_team'),
					icon: 'cross',
				},
				action: RemoveFromTeamAction,
			},
			{
				label: {
					label: t('Delete'),
					icon: 'trash',
				},
				action: DeleteChannelAction,
			},
		];
	}, [
		DeleteChannelAction,
		RemoveFromTeamAction,
		room._id,
		room.t,
		room.teamDefault,
		t,
		updateRoomEndpoint,
	]);

	return (
		<Menu
			flexShrink={0}
			key='menu'
			tiny
			renderItem={({ label: { label, icon }, ...props }) =>
				icon.match(/hash/) ? (
					<Option {...props} label={label} icon={icon}>
						<CheckBox checked={room.teamDefault} />
					</Option>
				) : (
					<Box color='danger-600'>
						<Option {...props} label={label} icon={icon} />
					</Box>
				)
			}
			options={menuOptions}
		/>
	);
};

export const TeamChannelItem = ({ room, onClickView }) => {
	const t = useTranslation();
	const [showButton, setShowButton] = useState();

	const isReduceMotionEnabled = usePrefersReducedMotion();
	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: setShowButton,
	};

	const onClick = usePreventProgation();

	return (
		<Option id={room._id} data-rid={room._id} {...handleMenuEvent} onClick={onClickView}>
			<Option.Avatar>
				<RoomAvatar room={room} size='x28' />
			</Option.Avatar>
			<Option.Column>
				{room.t === 'c' ? <Icon name='hash' size='x15' /> : <Icon name='hashtag-lock' size='x15' />}
			</Option.Column>
			<Option.Content>
				<Box display='inline-flex'>
					{roomTypes.getRoomName(room.t, room)}{' '}
					{room.teamDefault ? <Breadcrumbs.Tag>{t('Team_Auto-join')}</Breadcrumbs.Tag> : ''}
				</Box>
			</Option.Content>
			<Option.Menu onClick={onClick}>
				{showButton ? <RoomActions room={room} /> : <ActionButton ghost tiny icon='kebab' />}
			</Option.Menu>
		</Option>
	);
};

TeamChannelItem.Skeleton = Option.Skeleton;
