export class RankingService {
  async getRanking(periodo?: string) {
    return {
      periodo: periodo ?? 'global',
      ranking: []
    }
  }
}
