import { Box, Margins, Table, Avatar, Tag, Icon } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useState, useCallback } from 'react';

import MarkdownText from '../../components/MarkdownText';
import GenericTable from '../../components/GenericTable';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import { useFormatDate } from '../../hooks/useFormatDate';
import { roomTypes } from '../../../app/utils/client';
import { useQuery } from './hooks';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

function RoomTags({ room }) {
	const t = useTranslation();
	return <Box mi='x4' alignItems='center' display='flex'>
		<Margins inline='x2'>
			{room.default && <Tag variant='primary'>{t('default')}</Tag>}
			{room.featured && <Tag variant='primary'>{t('featured')}</Tag>}
		</Margins>
	</Box>;
}

function TeamsTable() {
	const t = useTranslation();
	const [sort, setSort] = useState(['name', 'asc']);
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const onHeaderClick = useCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	}, [sort]);

	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'channelsCount'} direction={sort[1]} active={sort[0] === 'channelsCount'} onClick={onHeaderClick} sort='channelsCount' style={{ width: '100px' }}>{t('Channels')}</GenericTable.HeaderCell>,
		mediaQuery && <GenericTable.HeaderCell key={'createdAt'} direction={sort[1]} active={sort[0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt' style={{ width: '150px' }}>{t('Created_at')}</GenericTable.HeaderCell>,
	].filter(Boolean), [sort, onHeaderClick, t, mediaQuery]);

	const channelsRoute = useRoute('channel');
	const groupsRoute = useRoute('group');

	const query = useQuery(params, sort, 'teams');

	const { value: data = { result: [] } } = useEndpointData('directory', query);

	const onClick = useMemo(() => (name, type) => (e) => {
		if (e.type === 'click' || e.key === 'Enter') {
			type === 'c' ? channelsRoute.push({ name }) : groupsRoute.push({ name });
		}
	}, [channelsRoute, groupsRoute]);

	const formatDate = useFormatDate();
	const renderRow = useCallback((team) => {
		const { _id, ts, t, name, fname, topic, roomsCount } = team;
		const avatarUrl = roomTypes.getConfig(t).getAvatarPath(team);

		return <Table.Row key={_id} onKeyDown={onClick(name, t)} onClick={onClick(name, t)} tabIndex={0} role='link' action>
			<Table.Cell>
				<Box display='flex'>
					<Box flexGrow={0}>
						<Avatar size='x40' title={fname || name} url={avatarUrl} />
					</Box>
					<Box grow={1} mi='x8' style={style}>
						<Box display='flex' alignItems='center'>
							<Icon name={roomTypes.getIcon(team)} color='hint' /> <Box fontScale='p2' mi='x4'>{fname || name}</Box><RoomTags room={team} style={style} />
						</Box>
						{topic && <MarkdownText variant='inlineWithoutBreaks' fontScale='p1' color='hint' style={style} content={topic} />}
					</Box>
				</Box>
			</Table.Cell>
			<Table.Cell fontScale='p1' color='hint' style={style}>
				{roomsCount}
			</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' color='hint' style={style}>
				{formatDate(ts)}
			</Table.Cell>}
		</Table.Row>;
	}
	, [formatDate, mediaQuery, onClick]);

	return <GenericTable
		header={header}
		renderRow={renderRow}
		results={data.result}
		setParams={setParams}
		total={data.total}
	/>;
}

export default function TeamsTab(props) {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <TeamsTable {...props} />;
	}

	return <NotAuthorizedPage />;
}
